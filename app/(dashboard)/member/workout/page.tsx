import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { WorkoutChecklist } from "@/components/member/workout-checklist";

export default async function MemberWorkoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();

  // Fetch active workout routine
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("member_id", member.id)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[new Date().getDay()];
  const todayRoutine = plan?.days?.find((d: any) => d.day.toLowerCase() === currentDayName.toLowerCase()) || plan?.days?.[0];

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Today's Workout Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {plan?.title || "Prescribed Gym Split"} • {todayRoutine ? `${todayRoutine.day} — ${todayRoutine.focus}` : "Rest Day"}
        </p>
      </section>

      {todayRoutine ? (
        <WorkoutChecklist routine={todayRoutine} />
      ) : (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
          No workout routine assigned for today. Enjoy your rest day!
        </div>
      )}
    </div>
  );
}
