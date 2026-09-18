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
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 1. ACTION: SCHEDULE PT SESSION
    if (action === "SCHEDULE") {
      const { packageId, sessionDate, sessionTime, workoutNotes } = body;

      if (!packageId || !sessionDate || !sessionTime) {
        return NextResponse.json(
          { error: "packageId, sessionDate, and sessionTime are required" },
          { status: 400 }
        );
      }

      const { data: result, error: rpcErr } = await supabase.rpc("schedule_pt_session", {
        p_package_id: packageId,
        p_session_date: sessionDate,
        p_session_time: sessionTime,
        p_workout_notes: workoutNotes || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!result?.success) {
        return NextResponse.json({ error: result?.error || "Failed to schedule session" }, { status: 400 });
      }

      // Enqueue notification for member
      const { data: pkg } = await admin
        .from("pt_packages")
        .select("member_id, members(profile_id)")
        .eq("id", packageId)
        .single();

      const memberProfileId = (pkg?.members as any)?.profile_id;
      if (memberProfileId) {
        const dedupKey = `PT_SCHEDULED:${result.session_id}`;
        (async () => {
          try {
            const { event } = await enqueueNotificationEvent({
              gymId: profile.gym_id,
              userId: memberProfileId,
              type: "PT_SESSION_REMINDER",
              title: "ARK FIT - PT Session Booked",
              body: `Your coach ${profile.full_name} scheduled PT Session #${result.session_number} for ${sessionDate} at ${sessionTime.slice(0, 5)}.`,
              url: "/member/pt",
              referenceType: "pt_session",
              referenceId: result.session_id,
              deduplicationKey: dedupKey,
              data: { sessionId: result.session_id, sessionDate, sessionTime },
            });
            if (event) await dispatchSingleEvent(event.id);
          } catch (e) {
            console.error("PT session notification error:", e);
          }
        })();
      }

      return NextResponse.json({
        success: true,
        message: "PT session scheduled successfully",
        session: result,
      });
    }

    // 2. ACTION: RESCHEDULE PT SESSION
    if (action === "RESCHEDULE") {
      const { sessionId, newDate, newTime, notes } = body;

      if (!sessionId || !newDate || !newTime) {
        return NextResponse.json(
          { error: "sessionId, newDate, and newTime are required" },
          { status: 400 }
        );
      }

      const { data: result, error: rpcErr } = await supabase.rpc("reschedule_pt_session", {
        p_session_id: sessionId,
        p_new_date: newDate,
        p_new_time: newTime,
        p_notes: notes || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!result?.success) {
        return NextResponse.json({ error: result?.error || "Failed to reschedule session" }, { status: 400 });
      }

      // Notify member
      const { data: session } = await admin
        .from("pt_sessions")
        .select("member_id, members(profile_id)")
        .eq("id", sessionId)
        .single();

      const memberProfileId = (session?.members as any)?.profile_id;
      if (memberProfileId) {
        const dedupKey = `PT_RESCHEDULED:${sessionId}:${newDate}:${newTime}`;
        (async () => {
          try {
            const { event } = await enqueueNotificationEvent({
              gymId: profile.gym_id,
              userId: memberProfileId,
              type: "PT_SESSION_REMINDER",
              title: "ARK FIT - PT Session Rescheduled",
              body: `Your coach updated your PT session to ${newDate} at ${newTime.slice(0, 5)}.`,
              url: "/member/pt",
              referenceType: "pt_session",
              referenceId: sessionId,
              deduplicationKey: dedupKey,
              data: { sessionId, newDate, newTime },
            });
            if (event) await dispatchSingleEvent(event.id);
          } catch (e) {
            console.error("PT session reschedule notification error:", e);
          }
        })();
      }

      return NextResponse.json({
        success: true,
        message: "PT session rescheduled successfully",
        session: result,
      });
    }

    // 3. ACTION: CANCEL PT SESSION
    if (action === "CANCEL") {
      const { sessionId, restoreQuota = true, notes } = body;

      if (!sessionId) {
        return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
      }

      const { data: result, error: rpcErr } = await supabase.rpc("cancel_pt_session", {
        p_session_id: sessionId,
        p_restore_quota: Boolean(restoreQuota),
        p_notes: notes || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!result?.success) {
        return NextResponse.json({ error: result?.error || "Failed to cancel session" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "PT session cancelled",
        result,
      });
    }

    // 4. ACTION: COMPLETE PT SESSION
    if (action === "COMPLETE") {
      const { sessionId, trainerNotes } = body;

      if (!sessionId) {
        return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
      }

      const { data: result, error: rpcErr } = await supabase.rpc("complete_pt_session", {
        p_session_id: sessionId,
        p_trainer_notes: trainerNotes || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!result?.success) {
        return NextResponse.json({ error: result?.error || "Failed to complete session" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "PT session marked completed",
        result,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
