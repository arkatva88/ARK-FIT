import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify caller is staff (OWNER or TRAINER)
    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "OWNER" && profile.role !== "TRAINER")) {
      return NextResponse.json({ error: "Forbidden. Staff only." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { memberId, date, status, reason } = body;

    if (!memberId || !date || !status) {
      return NextResponse.json(
        { error: "memberId, date, and status are required" },
        { status: 400 }
      );
    }

    if (status !== "PRESENT" && status !== "ABSENT") {
      return NextResponse.json({ error: "Status must be PRESENT or ABSENT" }, { status: 400 });
    }

    // Verify target member belongs to caller's gym
    const { data: targetMember } = await admin
      .from("members")
      .select("id, gym_id, profiles(full_name)")
      .eq("id", memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.gym_id !== profile.gym_id) {
      return NextResponse.json(
        { error: "Forbidden. Cannot modify attendance for another gym's member." },
        { status: 403 }
      );
    }

    const method = profile.role === "OWNER" ? "MANUAL_OWNER" : "MANUAL_TRAINER";
    const now = new Date().toISOString();

    // Check if attendance already exists
    const { data: existing } = await admin
      .from("attendance")
      .select("id, status")
      .eq("gym_id", profile.gym_id)
      .eq("member_id", memberId)
      .eq("attendance_date", date)
      .maybeSingle();

    const { data: updatedRecord, error: attErr } = await admin
      .from("attendance")
      .upsert(
        {
          gym_id: profile.gym_id,
          member_id: memberId,
          attendance_date: date,
          status,
          method,
          check_in_time: status === "PRESENT" ? now : null,
          recorded_by: existing ? undefined : user.id,
          updated_by: user.id,
          updated_at: now,
        },
        { onConflict: "gym_id,member_id,attendance_date" }
      )
      .select()
      .single();

    if (attErr) {
      return NextResponse.json({ error: attErr.message || "Failed to update attendance" }, { status: 500 });
    }

    // Connect attendance with workout execution:
    if (status === "ABSENT") {
      // Flag SCHEDULED workouts as MISSED (Rule: Never touch COMPLETED workouts)
      await admin
        .from("workout_schedules")
        .update({ status: "MISSED", updated_at: now })
        .eq("member_id", memberId)
        .eq("workout_date", date)
        .eq("status", "SCHEDULED");
    } else if (status === "PRESENT") {
      // If a schedule was marked MISSED earlier in the day, restore to SCHEDULED
      await admin
        .from("workout_schedules")
        .update({ status: "SCHEDULED", updated_at: now })
        .eq("member_id", memberId)
        .eq("workout_date", date)
        .eq("status", "MISSED");
    }

    // Audit log for corrections/edits
    if (existing && existing.status !== status) {
      await admin.from("audit_logs").insert({
        gym_id: profile.gym_id,
        actor_id: user.id,
        event_type: "ATTENDANCE_CORRECTED",
        target_type: "member",
        target_id: memberId,
        metadata: {
          previous_status: existing.status,
          new_status: status,
          date,
          reason: reason || "Manual correction by staff",
          staff_name: profile.full_name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Attendance marked ${status}`,
      attendance: updatedRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
