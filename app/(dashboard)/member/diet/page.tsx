import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Salad } from "lucide-react";

export default async function MemberDietPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase.from("members").select("id").eq("profile_id", user.id).single();
  if (!member) notFound();

  const { data: dietPlan } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("member_id", member.id)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          My Nutrition Protocol
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Trainer-prescribed calorie targets, macronutrient guidelines, and meal timings.
        </p>
      </section>

      {dietPlan ? (
        <div className="space-y-6">
          {/* Macro Targets */}
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Daily Energy</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">{dietPlan.calories} kcal</span>
            </div>
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Daily Protein</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block tabular-nums">{dietPlan.protein_grams}g</span>
            </div>
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Fitness Goal</span>
              <span className="text-sm font-bold text-blue-800 mt-2 block uppercase">{dietPlan.goal}</span>
            </div>
          </section>

          {/* Meals List */}
          <div className="space-y-3">
            {dietPlan.meals?.map((meal: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{meal.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{meal.time}</span>
                </div>
                <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                  {meal.items?.map((it: string, i: number) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
          No diet plan currently assigned by your floor trainer.
        </div>
      )}
    </div>
  );
}
