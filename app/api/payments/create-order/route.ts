import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { membershipId, ptPackageId } = body;

    // Fetch user's member record
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("id, gym_id, profiles(full_name, phone)")
      .eq("profile_id", user.id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    let amount = 0;
    let description = "";

    // Authoritatively determine amount from database - NEVER trust client amount!
    if (membershipId) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("plan_name, amount")
        .eq("id", membershipId)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Membership not found" }, { status: 404 });
      }
      amount = Number(membership.amount);
      description = `ARK FIT - ${membership.plan_name} Renewal`;
    } else if (ptPackageId) {
      const { data: ptPkg } = await supabase
        .from("pt_packages")
        .select("package_name, price")
        .eq("id", ptPackageId)
        .single();

      if (!ptPkg) {
        return NextResponse.json({ error: "PT package not found" }, { status: 404 });
      }
      amount = Number(ptPkg.price);
      description = `ARK FIT - ${ptPkg.package_name}`;
    } else {
      // Default standard monthly fee renewal if none specified
      amount = 1500;
      description = "ARK FIT - Monthly Membership Fee";
    }

    // Generate unique order reference
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${member.id.slice(0, 4)}`;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;

    // If credentials are provided, call official Razorpay Orders API
    if (keyId && keySecret && !keyId.includes("placeholder")) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // in paise
            currency: "INR",
            receipt,
            notes: {
              member_id: member.id,
              gym_id: member.gym_id,
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
        } else {
          const rzpErrData = await rzpRes.json();
          return NextResponse.json(
            { error: rzpErrData.error?.description || "Failed to create payment order with Razorpay" },
            { status: 502 }
          );
        }
      } catch (rzpErr: any) {
        return NextResponse.json(
          { error: "Payment gateway communication failed: " + (rzpErr.message || "Unknown error") },
          { status: 502 }
        );
      }
    }

    // Insert pending payment in database using admin client
    // (Members have no INSERT RLS policy on payments — the insert is done
    //  server-side after full auth + ownership verification above)
    const admin = createAdminClient();
    const { data: paymentRecord, error: payErr } = await admin
      .from("payments")
      .insert({
        gym_id: member.gym_id,
        member_id: member.id,
        membership_id: membershipId || null,
        pt_package_id: ptPackageId || null,
        amount,
        currency: "INR",
        payment_method: "RAZORPAY",
        status: "PENDING",
        due_date: new Date().toISOString().split("T")[0],
        notes: description,
        razorpay_order_id: razorpayOrderId,
      })
      .select("id")
      .single();

    if (payErr) {
      return NextResponse.json({ error: "Failed to record order: " + payErr.message }, { status: 500 });
    }

    return NextResponse.json({
      orderId: razorpayOrderId,
      amount: Math.round(amount * 100), // in paise
      currency: "INR",
      keyId,
      paymentId: paymentRecord.id,
      description,
      prefill: {
        name: (member as any).profiles?.full_name,
        contact: (member as any).profiles?.phone,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
