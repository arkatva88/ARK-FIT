import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function TrainerDietPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user?.id).single();
  if (!trainer) return null;

  const { data: dietPlans } = await supabase
    .from("diet_plans")
    .select(`
      id,
      goal,
      calories,
      protein_grams,
      meals,
      members (
        id,
        profiles (
          full_name
        )
      )
    `)
    .eq("status", "ACTIVE");

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Athlete Nutrition Protocols
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Trainer-prescribed diet plans with daily caloric and protein targets.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {dietPlans && dietPlans.length > 0 ? (
          dietPlans.map((d: any) => {
            const memberProfile = Array.isArray(d.members?.profiles) ? d.members?.profiles[0] : d.members?.profiles;
            return (
              <div key={d.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{memberProfile?.full_name || "Athlete"}</h3>
                      <span className="text-xs text-[#1E40AF] font-medium uppercase">{d.goal}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 block tabular-nums">{d.calories} kcal</span>
                      <span className="text-xs text-emerald-700 font-semibold">{d.protein_grams}g Protein</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs mt-3">
                    {d.meals?.map((m: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50">
                        <span className="font-semibold text-slate-900 block">{m.name} ({m.time})</span>
                        <span className="text-slate-600 mt-0.5 block truncate">{m.items?.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/trainer/members/${d.members?.id}`}
                  className="w-full h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Edit Athlete Diet</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            No active diet plans found. Open an athlete profile from "My Members" to assign their nutrition targets.
          </div>
        )}
      </div>
    </div>
  );
}
