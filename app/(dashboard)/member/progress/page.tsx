import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MemberProgressPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase.from("members").select("id").eq("profile_id", user.id).single();
  if (!member) notFound();

  // Fetch Progress records
  const { data: records } = await supabase
    .from("progress_records")
    .select("*")
    .eq("member_id", member.id)
    .order("recorded_at", { ascending: false });

  const latest = records?.[0];

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Progress & Milestones
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Scale weight trends, circumference measurements, and strength personal records.
        </p>
      </section>

      {/* Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Weight</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
          </span>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Chest</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {latest?.chest_inches ? `${latest.chest_inches}"` : "—"}
          </span>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Bench Press</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block tabular-nums">
            {latest?.bench_press_kg ? `${latest.bench_press_kg} kg` : "—"}
          </span>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Squat PR</span>
          <span className="text-2xl font-bold text-blue-800 mt-1 block tabular-nums">
            {latest?.squat_kg ? `${latest.squat_kg} kg` : "—"}
          </span>
        </div>
      </div>

      {/* Progress History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Metrics Log</h3>
        </div>

        <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase whitespace-nowrap">
              <tr>
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
                records.map((r: any) => (
                  <tr key={r.id} className="text-slate-800 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-500 whitespace-nowrap">{formatDate(r.recorded_at)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums whitespace-nowrap">{r.weight_kg ? `${r.weight_kg} kg` : "—"}</td>
                    <td className="px-5 py-3.5 tabular-nums whitespace-nowrap">{r.chest_inches ? `${r.chest_inches}"` : "—"}</td>
                    <td className="px-5 py-3.5 tabular-nums whitespace-nowrap">{r.waist_inches ? `${r.waist_inches}"` : "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{r.bench_press_kg ? `${r.bench_press_kg} kg` : "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-blue-800 tabular-nums whitespace-nowrap">{r.squat_kg ? `${r.squat_kg} kg` : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">
                    No progress records logged yet. Your floor coach can record measurements during your sessions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
