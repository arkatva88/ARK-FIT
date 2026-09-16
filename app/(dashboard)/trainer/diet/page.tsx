import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Salad } from "lucide-react";
import Link from "next/link";

export const revalidate = 15;

export default async function TrainerDietPage() {
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

  const { data: dietPlans } = memberIds.length > 0
    ? await supabase
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
        .in("member_id", memberIds)
        .eq("status", "ACTIVE")
        .order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Athlete Nutrition Protocols
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Trainer-prescribed diet plans with daily caloric and protein targets for your assigned athletes.
          </p>
        </div>

        <Link
          href="/trainer/members"
          className="h-8 px-3.5 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
        >
          <Salad className="w-3.5 h-3.5" />
          <span>Assign Protocol</span>
        </Link>
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
                      <span className="text-xs text-[#1E40AF] font-medium uppercase tracking-wider">{d.goal}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 block tabular-nums">{d.calories} kcal</span>
                      <span className="text-xs text-emerald-700 font-semibold">{d.protein_grams}g Protein</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs mt-3">
                    {d.meals?.map((m: any, idx: number) => {
                      const itemsStr = Array.isArray(m.items) ? m.items.join(", ") : typeof m.items === "string" ? m.items : "";
                      return (
                        <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50">
                          <span className="font-semibold text-slate-900 block">{m.name} {m.time ? `(${m.time})` : ""}</span>
                          <span className="text-slate-600 mt-0.5 block truncate">{itemsStr}</span>
                        </div>
                      );
                    })}
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
            No active diet protocols found for your assigned athletes. Select an athlete from "My Members" to assign nutrition targets.
          </div>
        )}
      </div>
    </div>
  );
}
