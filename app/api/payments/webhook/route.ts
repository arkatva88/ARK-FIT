import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

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

    // Idempotent handling for payment.captured or order.paid
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        // Fetch existing payment record
        const { data: existingPayment } = await admin
          .from("payments")
          .select("id, status, member_id, membership_id")
          .eq("razorpay_order_id", orderId)
          .single();

        // Ensure idempotency: only update if not already PAID
        if (existingPayment && existingPayment.status !== "PAID") {
          await admin
            .from("payments")
            .update({
              status: "PAID",
              razorpay_payment_id: paymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", existingPayment.id);

          if (existingPayment.membership_id) {
            const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];

            await admin
              .from("memberships")
              .update({
                status: "ACTIVE",
                expiry_date: newExpiry,
              })
              .eq("id", existingPayment.membership_id);

            await admin
              .from("members")
              .update({
                status: "ACTIVE",
                membership_expiry: newExpiry,
              })
              .eq("id", existingPayment.member_id);
          }
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
