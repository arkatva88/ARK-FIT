import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Strict validation of all payment identifiers
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters (order_id, payment_id, signature)" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Server payment configuration missing" },
        { status: 500 }
      );
    }

    // Authoritative server-side HMAC-SHA256 signature verification
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Payment verification failed: signature mismatch" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch existing payment record
    const { data: payment, error: fetchErr } = await admin
      .from("payments")
      .select("id, gym_id, member_id, membership_id, pt_package_id, status, amount, currency")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: "Order record not found" }, { status: 404 });
    }

    // Fetch caller profile and member record to ensure tenant isolation
    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id")
      .eq("id", user.id)
      .single();

    const { data: member } = await admin
      .from("members")
      .select("id, gym_id, profile_id, membership_expiry, profiles(full_name)")
      .eq("id", payment.member_id)
      .single();

    const isOwner = profile?.role === "OWNER" && profile.gym_id === payment.gym_id;
    const isPayingMember = member?.profile_id === user.id;

    if (!isOwner && !isPayingMember) {
      return NextResponse.json(
        { error: "Forbidden: payment record does not belong to authenticated user" },
        { status: 403 }
      );
    }

    // Idempotency: if already PAID, return success immediately without double-extending
    if (payment.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        paymentId: payment.id,
      });
    }

    // Update payment record to PAID
    const { error: updateErr } = await admin
      .from("payments")
      .update({
        status: "PAID",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update payment status: " + updateErr.message },
        { status: 500 }
      );
    }

    // Authoritative Safe Expiry Calculation
    // Scenario 1: Paying before expiry -> preserve remaining days (current_expiry + 30 days)
    // Scenario 2: Paying after expiry -> start from today (today + 30 days)
    const todayStr = new Date().toISOString().split("T")[0];
    let newExpiry: string;

    if (member?.membership_expiry && new Date(member.membership_expiry) >= new Date(todayStr)) {
      const base = new Date(member.membership_expiry);
      base.setDate(base.getDate() + 30);
      newExpiry = base.toISOString().split("T")[0];
    } else {
      const base = new Date(todayStr);
      base.setDate(base.getDate() + 30);
      newExpiry = base.toISOString().split("T")[0];
    }

    // Update membership and member records
    if (payment.membership_id) {
      await admin
        .from("memberships")
        .update({
          status: "ACTIVE",
          expiry_date: newExpiry,
        })
        .eq("id", payment.membership_id);
    }

    if (member) {
      await admin
        .from("members")
        .update({
          status: "ACTIVE",
          membership_expiry: newExpiry,
        })
        .eq("id", member.id);
    }

    // If payment was for a PT package, activate the package
    if (payment.pt_package_id) {
      const pkgExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      await admin
        .from("pt_packages")
        .update({
          status: "ACTIVE",
          expiry_date: pkgExpiry,
        })
        .eq("id", payment.pt_package_id);
    }

    // Decoupled notification dispatch (notification failure NEVER rolls back verified payment)
    (async () => {
      try {
        if (member?.profile_id) {
          const memberDedupKey = `PAYMENT_CONFIRMATION:${payment.id}:${member.profile_id}`;
          const { event } = await enqueueNotificationEvent({
            gymId: payment.gym_id,
            userId: member.profile_id,
            type: "PAYMENT_RECEIVED",
            title: "ARK FIT - Payment Confirmed!",
            body: `Your payment of ${payment.currency} ${payment.amount} is verified. Your gym membership is active until ${newExpiry}!`,
            url: "/member/payments",
            referenceType: "payment",
            referenceId: payment.id,
            deduplicationKey: memberDedupKey,
            data: { paymentId: payment.id, orderId: razorpay_order_id, newExpiry },
          });

          if (event) {
            await dispatchSingleEvent(event.id);
          }

          // Operational alert for gym owner
          const { data: owner } = await admin
            .from("profiles")
            .select("id")
            .eq("gym_id", payment.gym_id)
            .eq("role", "OWNER")
            .maybeSingle();

          if (owner?.id) {
            const memberName = (member as any)?.profiles?.full_name || "Member";
            const ownerDedupKey = `OWNER_PAYMENT_COLLECTED:${payment.id}:${owner.id}`;
            const { event: ownerEvent } = await enqueueNotificationEvent({
              gymId: payment.gym_id,
              userId: owner.id,
              type: "PAYMENT_RECEIVED",
              title: "ARK FIT - Fee Collected",
              body: `${memberName} paid ${payment.currency} ${payment.amount} online. Access extended to ${newExpiry}.`,
              url: "/owner/payments",
              referenceType: "payment",
              referenceId: payment.id,
              deduplicationKey: ownerDedupKey,
              data: { paymentId: payment.id, memberId: member.id },
            });

            if (ownerEvent) {
              await dispatchSingleEvent(ownerEvent.id);
            }
          }
        }
      } catch (notifyErr) {
        console.error("Payment confirmation notification failed (payment remains valid):", notifyErr);
      }
    })();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      newExpiry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
