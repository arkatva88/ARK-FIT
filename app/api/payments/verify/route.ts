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

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Strict validation of all payment identifiers
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment parameters (order_id, payment_id, signature)" },
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

    // Verify authenticated member ownership of this order
    const { data: member } = await admin
      .from("members")
      .select("id, gym_id, profile_id")
      .eq("profile_id", user.id)
      .single();

    // Fetch existing payment record
    const { data: payment, error: fetchErr } = await admin
      .from("payments")
      .select("id, member_id, membership_id, pt_package_id, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: "Order record not found" }, { status: 404 });
    }

    // Security check: verify this payment belongs to the calling user (or user is owner)
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = profile?.role === "OWNER";
    if (!isOwner && member && payment.member_id !== member.id) {
      return NextResponse.json(
        { error: "Forbidden: payment does not belong to authenticated user" },
        { status: 403 }
      );
    }

    // Idempotency: if already PAID, return success immediately
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

    // Extend membership if payment was for membership renewal
    if (payment.membership_id) {
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      await admin
        .from("memberships")
        .update({
          status: "ACTIVE",
          expiry_date: newExpiry,
        })
        .eq("id", payment.membership_id);

      await admin
        .from("members")
        .update({
          status: "ACTIVE",
          membership_expiry: newExpiry,
        })
        .eq("id", payment.member_id);
    }

    // Asynchronously trigger idempotent payment confirmation notifications
    // (Separation of concerns: push failures never rollback verified payment)
    (async () => {
      try {
        if (member?.profile_id) {
          const memberDedupKey = `PAYMENT_CONFIRMATION:${payment.id}:${member.profile_id}`;
          const { event } = await enqueueNotificationEvent({
            gymId: member.gym_id,
            userId: member.profile_id,
            type: "PAYMENT_RECEIVED",
            title: "ARK FIT - Payment Confirmed!",
            body: "Your gym membership payment has been confirmed. Your access is active!",
            url: "/member/payments",
            referenceType: "payment",
            referenceId: payment.id,
            deduplicationKey: memberDedupKey,
            data: { paymentId: payment.id, orderId: razorpay_order_id },
          });

          if (event) {
            await dispatchSingleEvent(event.id);
          }

          // Also trigger operational notification for gym owner
          const { data: owner } = await admin
            .from("profiles")
            .select("id")
            .eq("gym_id", member.gym_id)
            .eq("role", "OWNER")
            .maybeSingle();

          if (owner?.id) {
            const ownerDedupKey = `OWNER_PAYMENT_COLLECTED:${payment.id}:${owner.id}`;
            const { event: ownerEvent } = await enqueueNotificationEvent({
              gymId: member.gym_id,
              userId: owner.id,
              type: "PAYMENT_RECEIVED",
              title: "ARK FIT - New Payment Collected",
              body: `Payment confirmed for order #${razorpay_order_id.slice(-6)}.`,
              url: "/owner/payments",
              referenceType: "payment",
              referenceId: payment.id,
              deduplicationKey: ownerDedupKey,
              data: { paymentId: payment.id },
            });

            if (ownerEvent) {
              await dispatchSingleEvent(ownerEvent.id);
            }
          }
        }
      } catch (notifyErr) {
        console.error("Payment confirmation notification error:", notifyErr);
      }
    })();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
