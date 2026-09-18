import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const memberIdParam = searchParams.get("memberId");
    const statusParam = searchParams.get("status");

    // Fetch caller profile
    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine target member
    let targetMemberId = memberIdParam;
    if (profile.role === "MEMBER") {
      const { data: member } = await admin
        .from("members")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      if (!member) return NextResponse.json({ error: "Member record not found" }, { status: 404 });
      targetMemberId = member.id;
    }

    let query = admin
      .from("workout_schedules")
      .select(`
        *,
        member:members (
          id,
          profiles (full_name, phone)
        )
      `)
      .eq("gym_id", profile.gym_id);

    if (targetMemberId) {
      query = query.eq("member_id", targetMemberId);
    }
    if (dateParam) {
      query = query.eq("workout_date", dateParam);
    }
    if (statusParam) {
      query = query.eq("status", statusParam);
    }

    const { data: schedules, error: schedErr } = await query.order("workout_date", { ascending: true });

    if (schedErr) {
      return NextResponse.json({ error: schedErr.message }, { status: 500 });
    }

    // If a specific member and date was requested, and no schedule exists yet:
    // Seamlessly provision from active workout_plans routine for that day of week!
    if (targetMemberId && dateParam && (!schedules || schedules.length === 0)) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDayName = dayNames[new Date(dateParam).getDay()];

      const { data: plan } = await admin
        .from("workout_plans")
        .select("*")
        .eq("member_id", targetMemberId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (plan?.days && Array.isArray(plan.days)) {
        const routine = plan.days.find((d: any) => d.day?.toLowerCase() === targetDayName.toLowerCase()) || plan.days[0];

        if (routine && routine.exercises?.length > 0) {
          const { data: newSchedule } = await admin
            .from("workout_schedules")
            .insert({
              gym_id: profile.gym_id,
              member_id: targetMemberId,
              plan_id: plan.id,
              trainer_id: plan.trainer_id,
              workout_date: dateParam,
              day_name: routine.day || targetDayName,
              title: routine.focus || "Daily Workout Routine",
              exercises: routine.exercises,
              status: "SCHEDULED",
              completed_exercises: [],
            })
            .select(`
              *,
              member:members (
                id,
                profiles (full_name, phone)
              )
            `)
            .single();

          if (newSchedule) {
            return NextResponse.json({ schedules: [newSchedule] });
          }
        }
      }
    }

    return NextResponse.json({ schedules: schedules || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

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

    // 1. ACTION: RESCHEDULE WORKOUT
    if (action === "RESCHEDULE") {
      const { scheduleId, newDate, notes } = body;

      if (!scheduleId || !newDate) {
        return NextResponse.json({ error: "scheduleId and newDate are required" }, { status: 400 });
      }

      // Fetch existing schedule
      const { data: existingSched } = await admin
        .from("workout_schedules")
        .select(`
          *,
          member:members (
            id,
            profile_id,
            profiles (full_name)
          )
        `)
        .eq("id", scheduleId)
        .eq("gym_id", profile.gym_id)
        .single();

      if (!existingSched) {
        return NextResponse.json({ error: "Workout schedule not found" }, { status: 404 });
      }

      if (existingSched.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot reschedule an already completed workout" }, { status: 400 });
      }

      // Update old schedule to RESCHEDULED
      await admin
        .from("workout_schedules")
        .update({
          status: "RESCHEDULED",
          rescheduled_to_date: newDate,
          rescheduled_by: user.id,
          notes: notes || existingSched.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const newDayName = dayNames[new Date(newDate).getDay()];

      // Create new schedule on the target date
      const { data: newSched, error: insertErr } = await admin
        .from("workout_schedules")
        .insert({
          gym_id: existingSched.gym_id,
          member_id: existingSched.member_id,
          plan_id: existingSched.plan_id,
          trainer_id: existingSched.trainer_id,
          workout_date: newDate,
          day_name: newDayName,
          title: existingSched.title,
          exercises: existingSched.exercises,
          status: "SCHEDULED",
          completed_exercises: [],
          rescheduled_from_id: existingSched.id,
          notes: notes ? `Rescheduled from ${existingSched.workout_date}: ${notes}` : `Rescheduled from ${existingSched.workout_date}`,
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: "Failed to create rescheduled workout: " + insertErr.message }, { status: 500 });
      }

      // Enqueue notification to member
      const memberProfileId = (existingSched.member as any)?.profile_id;
      if (memberProfileId) {
        const dedupKey = `WORKOUT_RESCHEDULED:${existingSched.id}:${newDate}`;
        (async () => {
          try {
            const { event } = await enqueueNotificationEvent({
              gymId: profile.gym_id,
              userId: memberProfileId,
              type: "WORKOUT_REMINDER",
              title: "ARK FIT - Workout Rescheduled",
              body: `Your coach has rescheduled your ${existingSched.title} workout to ${newDate}.`,
              url: "/member/workout",
              referenceType: "workout",
              referenceId: newSched.id,
              deduplicationKey: dedupKey,
              data: { newDate, originalDate: existingSched.workout_date },
            });
            if (event) {
              await dispatchSingleEvent(event.id);
            }
          } catch (e) {
            console.error("Failed to notify member of rescheduled workout:", e);
          }
        })();
      }

      return NextResponse.json({
        success: true,
        message: `Workout rescheduled to ${newDate}.`,
        newScheduleId: newSched.id,
      });
    }

    // 2. ACTION: COMPLETE EXERCISE CHECKLIST ITEM
    if (action === "TOGGLE_EXERCISE") {
      const { scheduleId, completedIndices } = body;

      if (!scheduleId || !Array.isArray(completedIndices)) {
        return NextResponse.json({ error: "scheduleId and completedIndices array required" }, { status: 400 });
      }

      const { data: schedule } = await admin
        .from("workout_schedules")
        .select("id, status")
        .eq("id", scheduleId)
        .single();

      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }

      await admin
        .from("workout_schedules")
        .update({
          completed_exercises: completedIndices,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      return NextResponse.json({ success: true, completedIndices });
    }

    // 3. ACTION: COMPLETE FULL WORKOUT
    if (action === "COMPLETE_WORKOUT") {
      const { scheduleId, completedIndices, notes } = body;

      if (!scheduleId) {
        return NextResponse.json({ error: "scheduleId is required" }, { status: 400 });
      }

      const { data: schedule } = await admin
        .from("workout_schedules")
        .select("id, status, exercises")
        .eq("id", scheduleId)
        .single();

      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }

      const allIndices = schedule.exercises?.map((_: any, idx: number) => idx) || [];

      await admin
        .from("workout_schedules")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          completed_exercises: completedIndices || allIndices,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      return NextResponse.json({
        success: true,
        message: "Workout completed and recorded!",
      });
    }

    // 4. ACTION: FLAG MISSED (e.g. from attendance absence)
    if (action === "FLAG_MISSED") {
      const { memberId, date } = body;

      if (!memberId || !date) {
        return NextResponse.json({ error: "memberId and date are required" }, { status: 400 });
      }

      // If a schedule exists on that date with status SCHEDULED, mark as MISSED
      // Rule: Never alter COMPLETED workouts!
      const { data: sched } = await admin
        .from("workout_schedules")
        .select("id, status")
        .eq("member_id", memberId)
        .eq("workout_date", date)
        .maybeSingle();

      if (sched && sched.status === "SCHEDULED") {
        await admin
          .from("workout_schedules")
          .update({
            status: "MISSED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sched.id);

        return NextResponse.json({ success: true, status: "MISSED", scheduleId: sched.id });
      }

      return NextResponse.json({ success: true, message: "No scheduled workout needed updating" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
