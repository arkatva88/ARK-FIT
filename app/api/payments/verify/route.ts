import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing required payment parameters" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_arkfit_mock_secret";

    // Verify HMAC signature if signature was provided
    if (razorpay_signature && !keySecret.includes("mock")) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment signature verification failed" }, { status: 400 });
      }
    }

    // Update payment record in database
    const { data: payment, error: fetchErr } = await supabase
      .from("payments")
      .select("id, member_id, membership_id, pt_package_id, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: "Order record not found" }, { status: 404 });
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    const { error: updateErr } = await supabase
      .from("payments")
      .update({
        status: "PAID",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update payment status: " + updateErr.message }, { status: 500 });
    }

    // If payment was for membership, extend membership expiry
    if (payment.membership_id) {
      await supabase
        .from("memberships")
        .update({
          status: "ACTIVE",
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .eq("id", payment.membership_id);

      await supabase
        .from("members")
        .update({
          status: "ACTIVE",
          membership_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .eq("id", payment.member_id);
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
