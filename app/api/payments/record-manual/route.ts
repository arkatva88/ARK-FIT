import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Verify caller has OWNER role
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("role, gym_id, full_name")
      .eq("id", user.id)
      .single();

    if (ownerProfile?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only gym owners can manually record counter payments" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      memberId,
      amount,
      paymentMethod = "CASH",
      notes = "Counter Fee Collection",
      durationDays = 30,
      ptPackageId,
    } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    // 2. Fetch member and verify tenant isolation
    const { data: member, error: memberErr } = await admin
      .from("members")
      .select(`
        id,
        gym_id,
        profile_id,
        membership_expiry,
        profiles (
          full_name,
          phone
        ),
        gyms:gym_id (
          currency
        )
      `)
      .eq("id", memberId)
      .eq("gym_id", ownerProfile.gym_id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found in your gym" }, { status: 404 });
    }

    const currency = (member.gyms as any)?.currency || "INR";
    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Safe Expiry Calculation
    // Preserve remaining days if paying early
    let baseDate: Date;
    if (member.membership_expiry && new Date(member.membership_expiry) >= new Date(todayStr)) {
      baseDate = new Date(member.membership_expiry);
    } else {
      baseDate = new Date(todayStr);
    }
    baseDate.setDate(baseDate.getDate() + Number(durationDays || 30));
    const newExpiry = baseDate.toISOString().split("T")[0];

    // 4. Find or create active membership record
    let targetMembershipId: string | null = null;
    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("member_id", member.id)
      .eq("gym_id", ownerProfile.gym_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      targetMembershipId = existingMembership.id;
      await admin
        .from("memberships")
        .update({
          status: "ACTIVE",
          expiry_date: newExpiry,
          amount: numAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMembership.id);
    } else {
      const { data: newMs } = await admin
        .from("memberships")
        .insert({
          gym_id: ownerProfile.gym_id,
          member_id: member.id,
          plan_name: "Monthly All-Access",
          amount: numAmount,
          start_date: todayStr,
          expiry_date: newExpiry,
          status: "ACTIVE",
        })
        .select("id")
        .single();
      if (newMs) targetMembershipId = newMs.id;
    }

    // 5. Update member status and expiry
    await admin
      .from("members")
      .update({
        status: "ACTIVE",
        membership_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    // 6. If PT Package specified, activate it
    if (ptPackageId) {
      await admin
        .from("pt_packages")
        .update({
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ptPackageId)
        .eq("member_id", member.id);
    }

    // 7. Insert payment record as PAID
    const { data: paymentRecord, error: payErr } = await admin
      .from("payments")
      .insert({
        gym_id: ownerProfile.gym_id,
        member_id: member.id,
        membership_id: targetMembershipId,
        pt_package_id: ptPackageId || null,
        amount: numAmount,
        currency,
        payment_method: paymentMethod.toUpperCase(),
        status: "PAID",
        paid_at: new Date().toISOString(),
        notes: notes || "Counter Payment Recorded by Owner",
      })
      .select("id")
      .single();

    if (payErr) {
      return NextResponse.json({ error: "Failed to record payment entry: " + payErr.message }, { status: 500 });
    }

    // 8. Enqueue in-app receipt & notification for member
    if (member.profile_id) {
      const dedupKey = `PAYMENT_RECEIPT_MANUAL:${paymentRecord.id}`;
      (async () => {
        try {
          const { event } = await enqueueNotificationEvent({
            gymId: ownerProfile.gym_id,
            userId: member.profile_id,
            type: "PAYMENT_RECEIVED",
            title: "ARK FIT - Payment Receipt",
            body: `Receipt confirmed: ${currency} ${numAmount} recorded via ${paymentMethod}. Membership valid until ${newExpiry}.`,
            url: "/member/payments",
            referenceType: "payment",
            referenceId: paymentRecord.id,
            deduplicationKey: dedupKey,
            data: { paymentId: paymentRecord.id, amount: numAmount, method: paymentMethod, newExpiry },
          });
          if (event) {
            await dispatchSingleEvent(event.id);
          }
        } catch (err) {
          console.error("Failed to enqueue manual payment notification:", err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentRecord.id,
      newExpiry,
      message: `Payment of ${currency} ${numAmount} recorded. Membership extended to ${newExpiry}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
