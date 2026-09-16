import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function TrainerProgressPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user?.id).single();
  if (!trainer) return null;

  const { data: records } = await supabase
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
      members!inner (
        id,
        assigned_trainer_id,
        profiles (full_name)
      )
    `)
    .eq("members.assigned_trainer_id", trainer.id)
    .order("recorded_at", { ascending: false })
    .limit(40);

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Athlete Progress & Body Metrics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Recent body metrics, scale weight logs, and strength personal records for your assigned roster.
        </p>
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
                  No progress records logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
