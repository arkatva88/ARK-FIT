import { createClient } from "@/lib/supabase/server";
import { Phone, Users, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { MemberClientModal } from "@/components/owner/member-client-modal";
import { TrainerActionsModal } from "@/components/owner/trainer-actions-modal";

export default async function OwnerTrainersPage() {
  const supabase = createClient();

  // Fetch all trainers with profile and assigned member counts
  const { data: trainers } = await supabase
    .from("trainers")
    .select(`
      id,
      specialization,
      bio,
      is_active,
      created_at,
      profiles (
        full_name,
        phone,
        avatar_url
      ),
      assigned_members:members (
        id,
        member_type,
        status
      ),
      pt_packages (
        id,
        status,
        remaining_sessions
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Fitness Coaches & Staff</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Oversee trainer roster, floor workloads, active client ratios, and PT assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            {trainers?.filter((t) => t.is_active).length || 0} Coaches Active
          </span>
        </div>
      </section>

      {/* 2. Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trainers && trainers.length > 0 ? (
          trainers.map((t: any) => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            const activeMembers = t.assigned_members?.filter((m: any) => m.status === "ACTIVE").length || 0;
            const ptClients = t.assigned_members?.filter((m: any) => m.member_type === "PT" && m.status === "ACTIVE").length || 0;
            const activePtPackages = t.pt_packages?.filter((p: any) => p.status === "ACTIVE").length || 0;

            return (
              <div key={t.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold flex items-center justify-center text-sm">
                        {profile?.full_name?.slice(0, 2).toUpperCase() || "TR"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{profile?.full_name || "Trainer"}</h3>
                        <span className="text-xs text-[#1E40AF] font-medium block">
                          {t.specialization || "Fitness Coach"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        t.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-3">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile?.phone || "No contact phone"}
                  </div>

                  {t.bio && (
                    <p className="text-xs text-slate-600 italic line-clamp-2 bg-slate-50 p-2.5 rounded border border-slate-200 mt-3">
                      "{t.bio}"
                    </p>
                  )}
                </div>

                {/* Workload Metrics */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Members</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{activeMembers}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-amber-700 block">PT Clients</span>
                    <span className="text-sm font-bold text-amber-800 tabular-nums">{ptClients}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-blue-700 block">PT Packs</span>
                    <span className="text-sm font-bold text-blue-800 tabular-nums">{activePtPackages}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            No trainers registered in this gym.
          </div>
        )}
      </div>
    </div>
  );
}
