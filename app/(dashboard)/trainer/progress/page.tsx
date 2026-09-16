import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const revalidate = 15;

export default async function TrainerProgressPage() {
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

  // Fetch trainer's assigned member IDs
  const { data: myMembers } = await supabase
    .from("members")
    .select("id")
    .eq("assigned_trainer_id", trainer.id);

  const memberIds = myMembers?.map((m) => m.id) || [];

  const { data: records } = memberIds.length > 0
    ? await supabase
        .from("progress_records")
        .select(`
          id,
          recorded_at,
          weight_kg,
          chest_inches,
          waist_inches,
          arms_inches,
          bench_press_kg,
          squat_kg,
          members (
            id,
            profiles (full_name)
          )
        `)
        .in("member_id", memberIds)
        .order("recorded_at", { ascending: false })
        .limit(40)
    : { data: [] };

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Athlete Progress & Body Metrics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Recent body metrics, scale weight logs, and strength personal records for your assigned roster.
          </p>
        </div>

        <Link
          href="/trainer/members"
          className="h-8 px-3.5 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Log Assessment</span>
        </Link>
      </section>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Athlete</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Weight</th>
              <th className="px-5 py-3">Chest</th>
              <th className="px-5 py-3">Waist</th>
              <th className="px-5 py-3">Bench Press</th>
              <th className="px-5 py-3">Squat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records && records.length > 0 ? (
              records.map((r: any) => {
                const memberProfile = Array.isArray(r.members?.profiles) ? r.members?.profiles[0] : r.members?.profiles;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <Link href={`/trainer/members/${r.members?.id}`} className="hover:text-[#1E40AF]">
                        {memberProfile?.full_name || "Athlete"}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {formatDate(r.recorded_at)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">
                      {r.weight_kg ? `${r.weight_kg} kg` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                      {r.chest_inches ? `${r.chest_inches}"` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                      {r.waist_inches ? `${r.waist_inches}"` : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-700 tabular-nums">
                      {r.bench_press_kg ? `${r.bench_press_kg} kg` : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-blue-700 tabular-nums">
                      {r.squat_kg ? `${r.squat_kg} kg` : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No progress records logged yet. Open an athlete from "My Members" to record scale weight and body measurements.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
