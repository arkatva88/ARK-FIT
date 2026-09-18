import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        { error: "Forbidden: only gym owners can dispatch manual payment reminders." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { memberId, paymentId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required." },
        { status: 400 }
      );
    }

    // 2. Verify member belongs to owner's gym (tenant isolation)
    const { data: member } = await admin
      .from("members")
      .select(`
        id,
        gym_id,
        profile_id,
        status,
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

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in your gym." },
        { status: 404 }
      );
    }

    const memberName = (member.profiles as any)?.full_name || "Member";
    const currency = (member.gyms as any)?.currency || "INR";
    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Server-side Validation: Verify payment is actually outstanding
    let targetAmount = 1500;
    let targetDueDate = todayStr;

    if (paymentId) {
      const { data: payment } = await admin
        .from("payments")
        .select("id, status, amount, due_date, member_id")
        .eq("id", paymentId)
        .eq("gym_id", ownerProfile.gym_id)
        .maybeSingle();

      if (!payment || payment.member_id !== member.id) {
        return NextResponse.json(
          { error: "Payment record not found for this member" },
          { status: 404 }
        );
      }

      if (payment.status === "PAID") {
        return NextResponse.json({
          success: false,
          code: "ALREADY_PAID",
          message: "Payment is already completed",
        });
      }

      targetAmount = Number(payment.amount);
      targetDueDate = payment.due_date || todayStr;
    } else {
      // Check if member has any pending or overdue payments
      const { data: pendingPayments } = await admin
        .from("payments")
        .select("id, amount, due_date, status")
        .eq("member_id", member.id)
        .in("status", ["PENDING", "OVERDUE"])
        .order("due_date", { ascending: true })
        .limit(1);

      if (pendingPayments && pendingPayments.length > 0) {
        targetAmount = Number(pendingPayments[0].amount);
        targetDueDate = pendingPayments[0].due_date || todayStr;
      } else {
        // Check if membership is expiring soon or expired
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const isExpiringSoon = member.membership_expiry && member.membership_expiry <= sevenDaysFromNow;
        const isExpired = member.status === "EXPIRED" || (member.membership_expiry && member.membership_expiry < todayStr);

        if (!isExpiringSoon && !isExpired) {
          return NextResponse.json({
            success: false,
            code: "NO_DUES",
            message: "Member has no outstanding payment due",
          });
        }
      }
    }

    // 4. Duplicate protection & rate-limiting: max 1 reminder per day per obligation
    const deduplicationKey = `PAYMENT_REMINDER:${member.id}:${paymentId || "general"}:${todayStr}`;

    const { event, isDuplicate, error: enqueueErr } = await enqueueNotificationEvent({
      gymId: ownerProfile.gym_id,
      userId: member.profile_id,
      type: "PAYMENT_REMINDER",
      title: "ARK FIT - Membership Fee Due",
      body: `Hello ${memberName}, this is a friendly reminder that your gym subscription fee of ${currency} ${targetAmount} is due. Click to view invoice and renew online.`,
      url: "/member/payments",
      referenceType: "payment",
      referenceId: paymentId || member.id,
      deduplicationKey,
      data: {
        memberId: member.id,
        paymentId: paymentId || null,
        amount: targetAmount,
        dueDate: targetDueDate,
        remindedBy: ownerProfile.full_name,
        channel: "WEB_PUSH_AND_IN_APP",
      },
    });

    if (enqueueErr || !event) {
      return NextResponse.json(
        { error: "Failed to queue payment reminder: " + enqueueErr },
        { status: 500 }
      );
    }

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        message: `Reminder already sent recently to ${memberName} today.`,
        isDuplicate: true,
      });
    }

    // 5. Trigger asynchronous push dispatch
    dispatchSingleEvent(event.id).catch((err) =>
      console.error("Background reminder dispatch failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${memberName}.`,
      eventId: event.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
