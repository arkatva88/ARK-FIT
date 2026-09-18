import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET not configured on server.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const admin = createAdminClient();

    // 1. Payment Success Handlers (payment.captured or order.paid)
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        // Fetch existing payment record
        const { data: existingPayment } = await admin
          .from("payments")
          .select("id, gym_id, status, member_id, membership_id, pt_package_id, amount, currency")
          .eq("razorpay_order_id", orderId)
          .single();

        // Idempotency guard: only update if not already marked PAID
        if (existingPayment && existingPayment.status !== "PAID") {
          await admin
            .from("payments")
            .update({
              status: "PAID",
              razorpay_payment_id: paymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", existingPayment.id);

          // Fetch member for safe expiry calculation
          const { data: member } = await admin
            .from("members")
            .select("id, gym_id, profile_id, membership_expiry, profiles(full_name)")
            .eq("id", existingPayment.member_id)
            .single();

          const todayStr = new Date().toISOString().split("T")[0];
          let newExpiry: string;

          if (member?.membership_expiry && new Date(member.membership_expiry) >= new Date(todayStr)) {
            // Paid BEFORE expiry: preserve remaining days
            const base = new Date(member.membership_expiry);
            base.setDate(base.getDate() + 30);
            newExpiry = base.toISOString().split("T")[0];
          } else {
            // Paid AFTER expiry: new 30 days starts from today
            const base = new Date(todayStr);
            base.setDate(base.getDate() + 30);
            newExpiry = base.toISOString().split("T")[0];
          }

          if (existingPayment.membership_id) {
            await admin
              .from("memberships")
              .update({
                status: "ACTIVE",
                expiry_date: newExpiry,
              })
              .eq("id", existingPayment.membership_id);
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
          if (existingPayment.pt_package_id) {
            const pkgExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];

            await admin
              .from("pt_packages")
              .update({
                status: "ACTIVE",
                expiry_date: pkgExpiry,
              })
              .eq("id", existingPayment.pt_package_id);
          }

          // Asynchronously enqueue idempotent payment received notification
          if (member?.profile_id) {
            const memberDedupKey = `PAYMENT_CONFIRMATION:${existingPayment.id}:${member.profile_id}`;
            (async () => {
              try {
                const { event: notifEvent } = await enqueueNotificationEvent({
                  gymId: existingPayment.gym_id,
                  userId: member.profile_id,
                  type: "PAYMENT_RECEIVED",
                  title: "ARK FIT - Payment Confirmed!",
                  body: `Your payment of ${existingPayment.currency} ${existingPayment.amount} has been confirmed via Razorpay. Your membership is active until ${newExpiry}!`,
                  url: "/member/payments",
                  referenceType: "payment",
                  referenceId: existingPayment.id,
                  deduplicationKey: memberDedupKey,
                  data: { paymentId: existingPayment.id, orderId, newExpiry },
                });
                if (notifEvent) {
                  await dispatchSingleEvent(notifEvent.id);
                }
              } catch (e) {
                console.error("Webhook notification dispatch failed:", e);
              }
            })();
          }
        }
      }
    }

    // 2. Payment Failure Handler (payment.failed)
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const errorDesc = paymentEntity?.error_description || "Payment failed or declined";

      if (orderId) {
        const { data: existingPayment } = await admin
          .from("payments")
          .select("id, status")
          .eq("razorpay_order_id", orderId)
          .single();

        // Never overwrite a payment that already succeeded
        if (existingPayment && existingPayment.status !== "PAID") {
          await admin
            .from("payments")
            .update({
              status: "FAILED",
              notes: `Gateway failure: ${errorDesc}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPayment.id);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
