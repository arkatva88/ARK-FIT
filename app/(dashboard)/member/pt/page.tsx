import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Target, Clock, AlertCircle, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const revalidate = 15;

export default async function MemberPtDeskPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Member and verify PT capability layer
  const { data: member } = await supabase
    .from("members")
    .select(`
      id,
      member_type,
      assigned_trainer:trainers (
        id,
        specialization,
        bio,
        profiles (
          full_name,
          phone
        )
      )
    `)
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();
  const m = member as any;

  // Guard: Normal members cannot access the PT page
  if (m.member_type !== "PT") {
    redirect("/member");
  }

  const coach = Array.isArray(m.assigned_trainer) ? m.assigned_trainer[0] : m.assigned_trainer;
  const coachProfile = Array.isArray(coach?.profiles) ? coach?.profiles[0] : coach?.profiles;

  // Fetch PT Package
  const { data: ptPackage } = await supabase
    .from("pt_packages")
    .select("*")
    .eq("member_id", m.id)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  // Fetch All PT Sessions (History)
  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select(`
      *,
      trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("member_id", member.id)
    .order("session_date", { ascending: false })
    .order("session_time", { ascending: false });

  const isLowSessions = ptPackage && ptPackage.remaining_sessions <= 2;

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Dedicated Personal Training
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your one-on-one coaching package balance, session history, and coach notes.
        </p>
      </section>

      {/* PT Alerts */}
      {isLowSessions && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            You have only <strong>{ptPackage.remaining_sessions} PT sessions remaining</strong>. Contact your coach or gym reception to renew your package.
          </span>
        </div>
      )}

      {/* PT Package Status Card */}
      {ptPackage ? (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Active PT Package</span>
              <h2 className="text-lg font-bold text-slate-900">{ptPackage.package_name}</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900 block tabular-nums">
                {ptPackage.remaining_sessions}
              </span>
              <span className="text-xs text-slate-500">Sessions Remaining</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{ptPackage.used_sessions} Completed</span>
              <span>{ptPackage.total_sessions} Total Sessions</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.round((ptPackage.used_sessions / ptPackage.total_sessions) * 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Valid from: {formatDate(ptPackage.start_date)}</span>
            <span>Expires: <strong className="text-slate-800">{formatDate(ptPackage.expiry_date)}</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-lg border border-slate-200 bg-white text-center text-xs text-slate-400">
          No active PT package balance.
        </div>
      )}

      {/* Dedicated Coach Card */}
      {coach && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold flex items-center justify-center text-sm">
              {coachProfile?.full_name?.slice(0, 2).toUpperCase() || "TR"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#1E40AF] block">Dedicated Coach</span>
              <h3 className="font-bold text-slate-900 text-sm">{coachProfile?.full_name || "Coach"}</h3>
              <span className="text-xs text-slate-500 block">{coach.specialization || "General Fitness"}</span>
            </div>
          </div>

          {coachProfile?.phone && (
            <a
              href={`tel:${coachProfile.phone}`}
              className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Call Coach
            </a>
          )}
        </div>
      )}

      {/* PT Session History & Notes */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> PT Session History & Coach Notes
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {sessions && sessions.length > 0 ? (
            sessions.map((s: any) => {
              const isCompleted = s.status === "COMPLETED";

              return (
                <div key={s.id} className="p-4 space-y-1.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">Session #{s.session_number}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDate(s.session_date)} at {s.session_time.slice(0, 5)}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : s.status === "SCHEDULED"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {s.workout_notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      <strong>Focus:</strong> {s.workout_notes}
                    </p>
                  )}

                  {s.trainer_notes && (
                    <p className="text-xs text-emerald-700 italic">
                      Coach Observation: "{s.trainer_notes}"
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic py-8 text-center">
              No PT sessions recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
