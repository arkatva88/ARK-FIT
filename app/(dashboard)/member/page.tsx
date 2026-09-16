import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  Dumbbell,
  Target,
  Flame,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 15;

export default async function MemberHomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch Member record
  const { data: member } = await supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      membership_expiry,
      profiles (
        full_name,
        phone
      ),
      assigned_trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();
  const m = member as any;
  const isPt = m.member_type === "PT";

  // 2. Concurrently fetch Member dashboard resources in a single roundtrip
  const [
    { data: workoutPlan },
    { data: ptPkg },
    { data: session },
    { data: attendanceList },
    { data: latestProgress }
  ] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("*")
      .eq("member_id", m.id)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle(),
    isPt
      ? supabase
          .from("pt_packages")
          .select("*")
          .eq("member_id", m.id)
          .eq("status", "ACTIVE")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isPt
      ? supabase
          .from("pt_sessions")
          .select(`
            *,
            trainer:trainers (
              profiles (full_name)
            )
          `)
          .eq("member_id", m.id)
          .eq("session_date", today)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("attendance")
      .select("status")
      .eq("member_id", m.id),
    supabase
      .from("progress_records")
      .select("weight_kg")
      .eq("member_id", m.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const activePtPackage = ptPkg;
  const todayPtSession = session;

  const presentCount = attendanceList?.filter((a: any) => a.status === "PRESENT").length || 0;
  const attendancePct = attendanceList && attendanceList.length > 0
    ? Math.round((presentCount / attendanceList.length) * 100)
    : 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[new Date().getDay()];
  const todayWorkoutRoutine = workoutPlan?.days?.find((d: any) => d.day.toLowerCase() === currentDayName.toLowerCase()) || workoutPlan?.days?.[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const memberProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
  const assignedTrainer = Array.isArray(m.assigned_trainer) ? m.assigned_trainer[0] : m.assigned_trainer;
  const trainerProfile = Array.isArray(assignedTrainer?.profiles) ? assignedTrainer?.profiles[0] : assignedTrainer?.profiles;
  const coachName = trainerProfile?.full_name || "Assigned Floor Coach";

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {greeting}, {memberProfile?.full_name || "Athlete"}!
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>4-day streak</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Welcome back to ARK FIT. Consistent daily execution drives progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#1E40AF]"></span>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Training Status</p>
              <p className="text-xs font-bold text-slate-900">
                {isPt ? `Active PT Member • Coach: ${coachName}` : "General Member"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Today's Core Highlights Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Today's Scheduled Workout */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#1E40AF]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Scheduled Workout</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Est. 45 mins</span>
            </div>

            {todayWorkoutRoutine ? (
              <div className="mt-3">
                <h2 className="text-lg font-bold text-slate-900 mb-1">{todayWorkoutRoutine.focus}</h2>
                <p className="text-xs text-slate-500 mb-3">
                  {todayWorkoutRoutine.exercises?.length || 4} targeted exercises with progressive overload targets.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {todayWorkoutRoutine.exercises?.slice(0, 4).map((ex: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      {ex.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6">
                <h2 className="text-base font-bold text-slate-900">Active Recovery Day</h2>
                <p className="text-xs text-slate-500 mt-1">Focus on mobility, hydration, and nutrition.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Ready on gym floor</span>
            <Link
              href="/member/workout"
              className="h-8 px-4 bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Workout</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Today's PT Session or Coach Corner */}
        {isPt ? (
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1E40AF]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personal Training</span>
                </div>
                {todayPtSession?.status === "COMPLETED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800">
                    {todayPtSession ? "Scheduled Today" : "Rest / Unscheduled"}
                  </span>
                )}
              </div>

              {todayPtSession ? (
                <div className="mt-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Session #{todayPtSession.session_number} of {activePtPackage?.total_sessions || 12}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {todayPtSession.session_time.slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mb-2">Coach: {coachName}</p>

                  {todayPtSession.trainer_notes ? (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 mb-2">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Coach's Floor Note</p>
                      <p className="text-xs text-slate-800 italic">"{todayPtSession.trainer_notes}"</p>
                    </div>
                  ) : todayPtSession.workout_notes ? (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                      Target Focus: {todayPtSession.workout_notes}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 py-4">
                  <h3 className="text-base font-bold text-slate-900">No PT Session Scheduled Today</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You have <strong className="text-slate-800">{activePtPackage?.remaining_sessions || 0} sessions</strong> remaining in your package.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">
                {activePtPackage ? `${activePtPackage.remaining_sessions} sessions left` : "PT Desk"}
              </span>
              <Link
                href="/member/pt"
                className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>View PT Desk</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upgrade to PT</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold">1-on-1 Coaching</span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-bold text-slate-900">Reach Your Fitness Goals Faster</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Get dedicated guidance from certified trainers, customized progressive workout splits, and weekly accountability checks.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/member/profile"
                className="w-full h-8 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Inquire with Gym Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 3. Performance & Progress Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Attendance */}
        <Link
          href="/member/profile"
          className="p-5 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{attendancePct}%</div>
          <p className="text-xs text-slate-500 mt-1">Floor check-in consistency</p>
        </Link>

        {/* Metric 2: Body Weight */}
        <Link
          href="/member/progress"
          className="p-5 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Weight</span>
            <TrendingUp className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {latestProgress?.weight_kg ? `${latestProgress.weight_kg} kg` : "—"}
          </div>
          <p className="text-xs text-slate-500 mt-1">Scale measurement</p>
        </Link>

        {/* Metric 3: Membership Expiry */}
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription Validity</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 font-mono">
            {formatDate(m.membership_expiry)}
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Active Membership</p>
        </div>
      </section>
    </div>
  );
}
