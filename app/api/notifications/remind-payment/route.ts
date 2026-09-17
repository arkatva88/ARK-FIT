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

    // Verify caller has OWNER role
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

    const body = await req.json();
    const { memberId, paymentId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required." },
        { status: 400 }
      );
    }

    // Verify member belongs to same gym (tenant isolation)
    const { data: member } = await admin
      .from("members")
      .select(`
        id,
        gym_id,
        profile_id,
        membership_expiry,
        profiles (
          full_name
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
    const todayStr = new Date().toISOString().split("T")[0];
    const deduplicationKey = `PAYMENT_REMINDER:${member.id}:${paymentId || "general"}:${todayStr}`;

    const { event, isDuplicate, error: enqueueErr } = await enqueueNotificationEvent({
      gymId: ownerProfile.gym_id,
      userId: member.profile_id,
      type: "PAYMENT_REMINDER",
      title: "ARK FIT - Membership Fee Due",
      body: `Hello ${memberName}, this is a friendly reminder that your gym subscription fee is pending. Click to view billing and renew.`,
      url: "/member/payments",
      referenceType: "payment",
      referenceId: paymentId || member.id,
      deduplicationKey,
      data: {
        memberId: member.id,
        paymentId: paymentId || null,
        remindedBy: ownerProfile.full_name,
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
        message: `A payment reminder has already been sent to ${memberName} today.`,
        isDuplicate: true,
      });
    }

    // Trigger async dispatch
    dispatchSingleEvent(event.id).catch((err) =>
      console.error("Background reminder dispatch failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: `Payment reminder queued and dispatched for ${memberName}.`,
      eventId: event.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
