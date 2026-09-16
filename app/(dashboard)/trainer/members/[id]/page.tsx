import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Salad } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TrainerMemberActions } from "@/components/trainer/trainer-member-actions";

interface PageProps {
  params: { id: string };
}

export default async function TrainerMemberProfilePage({ params }: PageProps) {
  const supabase = createClient();
  const memberId = params.id;

  const { data: member } = await supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      membership_expiry,
      medical_conditions,
      profiles (
        full_name,
        phone
      )
    `)
    .eq("id", memberId)
    .single();

  if (!member) notFound();

  // Fetch Member's Workout Plan
  const { data: workoutPlan } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  // Fetch Member's Diet Plan
  const { data: dietPlan } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  // Fetch Member's PT Package & Sessions
  const { data: ptPackages } = await supabase
    .from("pt_packages")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  const m = member as any;
  const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;

  const isPt = m.member_type === "PT";
  const activePkg = ptPackages?.find((p) => p.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <Link
        href="/trainer/members"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Athlete List
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold text-base flex items-center justify-center">
              {profile?.full_name?.slice(0, 2).toUpperCase() || "MB"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.full_name || "Athlete"}</h1>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isPt ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isPt ? "PT Athlete" : "General Member"}
                </span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">
                Phone: {profile?.phone || "None"} • Member Expiry: {formatDate(m.membership_expiry)}
              </span>
            </div>
          </div>

          {isPt && activePkg && (
            <div className="text-right p-3 rounded border border-amber-200 bg-amber-50">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">PT Session Balance</span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {activePkg.used_sessions} / {activePkg.total_sessions} Used ({activePkg.remaining_sessions} Left)
              </span>
            </div>
          )}
        </div>

        {member.medical_conditions && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <strong>Medical / Injury Note:</strong> {member.medical_conditions}
          </div>
        )}
      </div>

      {/* Interactive Trainer Actions (Log Workout, Update Diet, Add Note, Add Progress) */}
      <TrainerMemberActions
        memberId={memberId}
        workoutPlan={workoutPlan}
        dietPlan={dietPlan}
      />

      {/* Grid: Workout, Diet & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Workout Plan Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#1E40AF]" /> Active Workout Routine
            </h3>
            {workoutPlan && <span className="text-xs text-[#1E40AF] font-semibold">{workoutPlan.title}</span>}
          </div>

          {workoutPlan ? (
            <div className="space-y-3">
              {workoutPlan.days?.map((day: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded border border-slate-200 bg-slate-50 text-xs">
                  <span className="font-bold text-slate-900 uppercase block mb-1.5">{day.day} • {day.focus}</span>
                  <div className="space-y-1">
                    {day.exercises?.map((ex: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-600 border-b border-slate-200/60 py-0.5 last:border-0">
                        <span className="text-slate-900 font-medium">{ex.name}</span>
                        <span className="font-mono text-slate-500">{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No workout assigned yet. Click "Assign Workout" above.</p>
          )}
        </div>

        {/* Diet Plan Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Salad className="w-4 h-4 text-emerald-600" /> Nutrition & Macros
            </h3>
            {dietPlan && (
              <span className="text-xs text-emerald-700 font-semibold">
                {dietPlan.calories} kcal • {dietPlan.protein_grams}g Protein
              </span>
            )}
          </div>

          {dietPlan ? (
            <div className="space-y-3">
              {dietPlan.meals?.map((m: any, idx: number) => (
                <div key={idx} className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>{m.name}</span>
                    <span className="text-slate-500 font-mono">{m.time}</span>
                  </div>
                  <ul className="text-slate-600 list-disc pl-4 space-y-0.5">
                    {m.items?.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No diet plan assigned yet. Click "Assign Diet" above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
