import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Users,
  Target,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Dumbbell,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { CompleteSessionButton } from "@/components/trainer/complete-session-button";

export const revalidate = 15; // 15s refresh on trainer floor

export default async function TrainerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  // Fetch Trainer profile
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, specialization, profiles(full_name)")
    .eq("profile_id", user?.id)
    .single();

  if (!trainer) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">
        Trainer profile not found.
      </div>
    );
  }

  const t = trainer as any;
  const trainerProfile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
  const trainerName = trainerProfile?.full_name || "Coach";

  // 1. Fetch Today's Scheduled PT Sessions for this Trainer
  const { data: todaySessions } = await supabase
    .from("pt_sessions")
    .select(`
      id,
      session_number,
      session_time,
      status,
      workout_notes,
      trainer_notes,
      members (
        id,
        profiles (
          full_name,
          phone
        )
      ),
      package:pt_packages (
        total_sessions,
        remaining_sessions
      )
    `)
    .eq("trainer_id", trainer.id)
    .eq("session_date", today)
    .order("session_time", { ascending: true });

  // 2. Fetch My Assigned Members
  const { data: myMembers } = await supabase
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
      pt_packages (
        total_sessions,
        remaining_sessions,
        status
      )
    `)
    .eq("assigned_trainer_id", trainer.id)
    .eq("status", "ACTIVE");

  const totalAssigned = myMembers?.length || 0;
  const ptCount = myMembers?.filter((m) => m.member_type === "PT").length || 0;

  // 3. Attention alerts for Trainer
  const lowSessionMembers = myMembers?.filter((m) => {
    const activePkg = m.pt_packages?.find((p: any) => p.status === "ACTIVE");
    return activePkg && activePkg.remaining_sessions <= 2;
  }) || [];

  const completedSessions = todaySessions?.filter((s) => s.status === "COMPLETED").length || 0;
  const scheduledSessions = todaySessions?.length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Quick CTAs */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Good morning, {trainerName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here is your coaching schedule and member focus for today, {formatDate(today)}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/trainer/pt-sessions"
            className="h-9 px-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded flex items-center gap-2 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>View Floor Schedule</span>
          </Link>
          <Link
            href="/trainer/notes"
            className="h-9 px-4 bg-[#1E40AF] text-white hover:bg-blue-800 font-medium text-xs rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Member Note</span>
          </Link>
        </div>
      </section>

      {/* 2. Quick Metrics Row (4 Compact Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's PT Sessions</span>
            <Clock className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{scheduledSessions} Scheduled</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>{completedSessions} completed, {scheduledSessions - completedSessions} upcoming</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Athletes</span>
            <Users className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalAssigned} Active</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>{ptCount} dedicated PT athletes</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Quota Alerts</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-700 tabular-nums">{lowSessionMembers.length} Clients</div>
            <div className="text-xs text-slate-500 mt-1">≤ 2 sessions remaining</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">On Duty</div>
            <div className="text-xs text-slate-500 mt-1">Morning shift active</div>
          </div>
        </div>
      </section>

      {/* 3. TODAY'S PT SESSIONS - The most important widget on gym floor */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#1E40AF]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Today's Floor PT Appointments
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {formatDate(today)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {todaySessions && todaySessions.length > 0 ? (
            todaySessions.map((session: any) => {
              const isCompleted = session.status === "COMPLETED";
              const memberProfile = Array.isArray(session.members?.profiles)
                ? session.members?.profiles[0]
                : session.members?.profiles;

              return (
                <div
                  key={session.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {session.session_time.slice(0, 5)}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {memberProfile?.full_name || "Athlete"}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        Session #{session.session_number}
                        {session.package ? ` of ${session.package.total_sessions}` : ""}
                      </span>
                    </div>

                    {session.workout_notes && (
                      <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        Focus: {session.workout_notes}
                      </p>
                    )}

                    {session.trainer_notes && (
                      <p className="text-xs text-emerald-700 italic mt-1">
                        Notes: "{session.trainer_notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                      </span>
                    ) : (
                      <CompleteSessionButton sessionId={session.id} />
                    )}

                    <Link
                      href={`/trainer/members/${session.members?.id}`}
                      className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 italic">
              No PT appointments scheduled on your floor calendar today.
            </div>
          )}
        </div>
      </div>

      {/* 4. ATTENTION REQUIRED: Low Session Quotas */}
      {lowSessionMembers.length > 0 && (
        <div className="p-5 rounded-lg border border-amber-200 bg-amber-50 space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">PT Packages Low on Sessions</h3>
          </div>
          <p className="text-xs text-slate-600">
            The following clients have 2 or fewer sessions remaining. Remind them to renew with the gym desk:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {lowSessionMembers.map((m: any) => {
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              const activePkg = m.pt_packages?.find((p: any) => p.status === "ACTIVE");
              return (
                <div key={m.id} className="p-3 rounded border border-amber-200 bg-white flex justify-between items-center text-xs shadow-sm">
                  <span className="font-semibold text-slate-900">{profile?.full_name || "Athlete"}</span>
                  <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {activePkg?.remaining_sessions} Left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Quick Floor Hub Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/trainer/members"
          className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm text-center"
        >
          <Users className="w-5 h-5 text-[#1E40AF] mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">My Members</span>
          <span className="text-[10px] text-slate-500">{totalAssigned} assigned</span>
        </Link>

        <Link
          href="/trainer/workouts"
          className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm text-center"
        >
          <Dumbbell className="w-5 h-5 text-[#1E40AF] mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Workouts</span>
          <span className="text-[10px] text-slate-500">Routines & splits</span>
        </Link>

        <Link
          href="/trainer/diet"
          className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm text-center"
        >
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Diet Plans</span>
          <span className="text-[10px] text-slate-500">Macros & meals</span>
        </Link>

        <Link
          href="/trainer/notes"
          className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#1E40AF] transition-colors shadow-sm text-center"
        >
          <FileText className="w-5 h-5 text-amber-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Floor Notes</span>
          <span className="text-[10px] text-slate-500">Observations</span>
        </Link>
      </div>
    </div>
  );
}
