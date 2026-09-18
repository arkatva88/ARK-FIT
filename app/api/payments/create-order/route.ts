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

    const body = await req.json().catch(() => ({}));
    const { membershipId, ptPackageId } = body;

    const admin = createAdminClient();

    // 1. Fetch user's member and gym details authoritatively
    const { data: member, error: memberErr } = await admin
      .from("members")
      .select(`
        id,
        gym_id,
        status,
        membership_expiry,
        profiles (
          full_name,
          phone
        ),
        gyms:gym_id (
          id,
          currency,
          name
        )
      `)
      .eq("profile_id", user.id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    const gymCurrency = (member.gyms as any)?.currency || "INR";
    const gymName = (member.gyms as any)?.name || "ARK FIT";
    let targetMembershipId: string | null = null;
    let targetPtPackageId: string | null = null;
    let amount = 0;
    let description = "";

    // 2. Authoritatively determine payable item and amount from database
    if (membershipId) {
      const { data: membership } = await admin
        .from("memberships")
        .select("id, plan_name, amount")
        .eq("id", membershipId)
        .eq("member_id", member.id)
        .eq("gym_id", member.gym_id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: "Authorized membership plan record not found" },
          { status: 404 }
        );
      }
      targetMembershipId = membership.id;
      amount = Number(membership.amount);
      description = `${gymName} - ${membership.plan_name} Renewal`;
    } else if (ptPackageId) {
      const { data: ptPkg } = await admin
        .from("pt_packages")
        .select("id, package_name, price, status")
        .eq("id", ptPackageId)
        .eq("member_id", member.id)
        .eq("gym_id", member.gym_id)
        .maybeSingle();

      if (!ptPkg) {
        return NextResponse.json(
          { error: "Authorized personal training package not found" },
          { status: 404 }
        );
      }
      targetPtPackageId = ptPkg.id;
      amount = Number(ptPkg.price);
      description = `${gymName} - ${ptPkg.package_name}`;
    } else {
      // Default standard membership for this member
      const { data: latestMembership } = await admin
        .from("memberships")
        .select("id, plan_name, amount")
        .eq("member_id", member.id)
        .eq("gym_id", member.gym_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestMembership) {
        targetMembershipId = latestMembership.id;
        amount = Number(latestMembership.amount);
        description = `${gymName} - ${latestMembership.plan_name} Renewal`;
      } else {
        // Create baseline membership if not present
        const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const { data: createdMembership } = await admin
          .from("memberships")
          .insert({
            gym_id: member.gym_id,
            member_id: member.id,
            plan_name: "Monthly All-Access",
            amount: 1500.0,
            start_date: new Date().toISOString().split("T")[0],
            expiry_date: member.membership_expiry || defaultExpiry,
            status: "ACTIVE",
          })
          .select("id, plan_name, amount")
          .single();

        if (createdMembership) {
          targetMembershipId = createdMembership.id;
          amount = Number(createdMembership.amount);
          description = `${gymName} - ${createdMembership.plan_name} Renewal`;
        } else {
          amount = 1500.0;
          description = `${gymName} - Monthly Membership Fee`;
        }
      }
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount calculated" }, { status: 400 });
    }

    // 3. Duplicate protection: Check if an active pending payment with Razorpay order was created in last 15 mins
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let existingPendingQuery = admin
      .from("payments")
      .select("id, razorpay_order_id, amount, currency, notes")
      .eq("member_id", member.id)
      .eq("status", "PENDING")
      .gte("created_at", fifteenMinutesAgo);

    if (targetMembershipId) {
      existingPendingQuery = existingPendingQuery.eq("membership_id", targetMembershipId);
    }
    if (targetPtPackageId) {
      existingPendingQuery = existingPendingQuery.eq("pt_package_id", targetPtPackageId);
    }

    const { data: existingPayment } = await existingPendingQuery.limit(1).maybeSingle();

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If an unexpired order already exists, reuse it to prevent spamming orphan payment rows
    if (existingPayment?.razorpay_order_id) {
      return NextResponse.json({
        orderId: existingPayment.razorpay_order_id,
        amount: Math.round(Number(existingPayment.amount) * 100),
        currency: existingPayment.currency || gymCurrency,
        keyId,
        paymentId: existingPayment.id,
        description: existingPayment.notes || description,
        prefill: {
          name: (member as any).profiles?.full_name,
          contact: (member as any).profiles?.phone,
        },
      });
    }

    // 4. Generate Razorpay order
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${member.id.slice(0, 4)}`;
    let razorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;

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
            amount: Math.round(amount * 100), // in paise/cents
            currency: gymCurrency,
            receipt,
            notes: {
              member_id: member.id,
              gym_id: member.gym_id,
              membership_id: targetMembershipId || "",
              pt_package_id: targetPtPackageId || "",
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
        } else {
          const rzpErrData = await rzpRes.json().catch(() => ({}));
          return NextResponse.json(
            { error: rzpErrData.error?.description || "Failed to create payment order with Razorpay" },
            { status: 502 }
          );
        }
      } catch (rzpErr: any) {
        return NextResponse.json(
          { error: "Payment gateway communication failed: " + (rzpErr.message || "Network error") },
          { status: 502 }
        );
      }
    }

    // 5. Insert pending payment record in database
    const { data: paymentRecord, error: payErr } = await admin
      .from("payments")
      .insert({
        gym_id: member.gym_id,
        member_id: member.id,
        membership_id: targetMembershipId || null,
        pt_package_id: targetPtPackageId || null,
        amount,
        currency: gymCurrency,
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
      amount: Math.round(amount * 100),
      currency: gymCurrency,
      keyId,
      paymentId: paymentRecord.id,
      description,
      prefill: {
        name: (member as any).profiles?.full_name,
        contact: (member as any).profiles?.phone,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
