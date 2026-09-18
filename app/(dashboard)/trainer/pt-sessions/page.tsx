import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CompleteSessionButton } from "@/components/trainer/complete-session-button";
import { PtSessionScheduleModal } from "@/components/trainer/pt-session-schedule-modal";
import { PtSessionActionModal } from "@/components/trainer/pt-session-action-modal";
import Link from "next/link";

export const revalidate = 15;

export default async function TrainerPtSessionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!trainer) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
        <h2 className="text-base font-semibold text-slate-900">Trainer Profile Inactive</h2>
        <p className="text-sm text-slate-500 mt-1">Please contact your gym administrator to link your coach account.</p>
      </div>
    );
  }

  const [
    { data: sessions },
    { data: activePackages }
  ] = await Promise.all([
    supabase
      .from("pt_sessions")
      .select(`
        id,
        session_number,
        session_date,
        session_time,
        status,
        workout_notes,
        trainer_notes,
        completed_at,
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
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: true })
      .limit(50),
    supabase
      .from("pt_packages")
      .select(`
        id,
        member_id,
        total_sessions,
        remaining_sessions,
        members (
          id,
          profiles (
            full_name,
            phone
          )
        )
      `)
      .eq("trainer_id", trainer.id)
      .eq("status", "ACTIVE")
  ]);

  const packageOptions = (activePackages || []).map((p: any) => {
    const profile = Array.isArray(p.members?.profiles) ? p.members?.profiles[0] : p.members?.profiles;
    return {
      id: p.id,
      memberId: p.member_id,
      memberName: profile?.full_name || "Athlete",
      phone: profile?.phone,
      totalSessions: p.total_sessions,
      remainingSessions: p.remaining_sessions,
    };
  });

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">PT Session Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Floor calendar, 1-click session completion, rescheduling, and athlete performance notes.
          </p>
        </div>
        <PtSessionScheduleModal packages={packageOptions} />
      </section>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sessions && sessions.length > 0 ? (
            sessions.map((s: any) => {
              const memberProfile = Array.isArray(s.members?.profiles) ? s.members?.profiles[0] : s.members?.profiles;
              const isCompleted = s.status === "COMPLETED";
              const isCancelled = s.status === "CANCELLED";
              const isRescheduled = s.status === "RESCHEDULED";

              return (
                <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trainer/members/${s.members?.id}`}
                        className="font-semibold text-slate-900 hover:text-[#1E40AF] text-sm"
                      >
                        {memberProfile?.full_name || "Athlete"}
                      </Link>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-semibold">
                        Session #{s.session_number} of {s.package?.total_sessions || "12"}
                      </span>
                      {isCancelled && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold uppercase">
                          Cancelled
                        </span>
                      )}
                      {isRescheduled && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold uppercase">
                          Rescheduled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[#1E40AF]">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(s.session_date)} at {s.session_time.slice(0, 5)}
                      </span>
                    </div>

                    {s.workout_notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                        Routine Focus: {s.workout_notes}
                      </p>
                    )}

                    {s.trainer_notes && (
                      <p className="text-xs text-emerald-700 italic mt-1.5">
                        Coach Note: "{s.trainer_notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                      </span>
                    ) : isCancelled || isRescheduled ? null : (
                      <>
                        <CompleteSessionButton sessionId={s.id} />
                        <PtSessionActionModal
                          session={{
                            id: s.id,
                            sessionNumber: s.session_number,
                            sessionDate: s.session_date,
                            sessionTime: s.session_time,
                            memberName: memberProfile?.full_name || "Athlete",
                          }}
                        />
                      </>
                    )}

                    <Link
                      href={`/trainer/members/${s.members?.id}`}
                      className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              No personal training sessions scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
