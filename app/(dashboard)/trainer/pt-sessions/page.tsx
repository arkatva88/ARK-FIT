import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CompleteSessionButton } from "@/components/trainer/complete-session-button";
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

  if (!trainer) return null;

  const { data: sessions } = await supabase
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
    .limit(50);

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">PT Session Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Floor calendar, 1-click session completion, and athlete performance notes.
        </p>
      </section>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sessions && sessions.length > 0 ? (
            sessions.map((s: any) => {
              const memberProfile = Array.isArray(s.members?.profiles) ? s.members?.profiles[0] : s.members?.profiles;
              const isCompleted = s.status === "COMPLETED";

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
                    ) : (
                      <CompleteSessionButton sessionId={s.id} />
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
