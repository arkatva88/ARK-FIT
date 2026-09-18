import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Dumbbell, Calendar, AlertCircle } from "lucide-react";
import { WorkoutChecklist } from "@/components/member/workout-checklist";
import { formatDate } from "@/lib/utils";

export default async function MemberWorkoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("id, gym_id")
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();

  const today = new Date().toISOString().split("T")[0];
  const admin = createAdminClient();

  // 1. Fetch today's schedule
  let { data: schedule } = await supabase
    .from("workout_schedules")
    .select("*")
    .eq("member_id", member.id)
    .eq("workout_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. If no schedule exists yet, attempt to provision from active workout plan
  if (!schedule) {
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("member_id", member.id)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle();

    if (plan?.days && Array.isArray(plan.days)) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = dayNames[new Date().getDay()];
      const routine = plan.days.find((d: any) => d.day.toLowerCase() === currentDayName.toLowerCase()) || plan.days[0];

      if (routine && routine.exercises?.length > 0) {
        const { data: provisioned } = await admin
          .from("workout_schedules")
          .insert({
            gym_id: member.gym_id,
            member_id: member.id,
            plan_id: plan.id,
            trainer_id: plan.trainer_id,
            workout_date: today,
            day_name: routine.day || currentDayName,
            title: routine.focus || "Daily Workout Split",
            exercises: routine.exercises,
            status: "SCHEDULED",
            completed_exercises: [],
          })
          .select()
          .single();

        schedule = provisioned;
      }
    }
  }

  const isRescheduled = schedule?.status === "RESCHEDULED";
  const isMissed = schedule?.status === "MISSED";

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Today's Workout Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {schedule ? `${schedule.day_name} — ${schedule.title}` : "Rest & Recovery Day"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span>{formatDate(today)}</span>
        </div>
      </section>

      {isMissed && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Missed Session</span>
            <span>You were absent for this scheduled workout. Your coach can reschedule it for an upcoming open day.</span>
          </div>
        </div>
      )}

      {isRescheduled && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Session Rescheduled</span>
            <span>This routine was rescheduled to {formatDate(schedule.rescheduled_to_date || "")}. Check your upcoming calendar.</span>
          </div>
        </div>
      )}

      {schedule && schedule.exercises && schedule.exercises.length > 0 ? (
        <WorkoutChecklist
          routine={{
            day: schedule.day_name,
            focus: schedule.title,
            exercises: schedule.exercises,
          }}
          scheduleId={schedule.id}
          initialCompletedIndices={schedule.completed_exercises || []}
          isCompleted={schedule.status === "COMPLETED"}
        />
      ) : (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
          No workout routine scheduled for today. Enjoy your rest and recovery day!
        </div>
      )}
    </div>
  );
}
