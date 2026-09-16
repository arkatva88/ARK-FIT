import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: { filter?: string; q?: string };
}

export default async function TrainerMembersPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const filter = searchParams.filter || "all";
  const query = searchParams.q || "";

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

  let memberQuery = supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      membership_expiry,
      medical_conditions,
      profiles (
        full_name,
        phone,
        avatar_url
      ),
      pt_packages (
        total_sessions,
        used_sessions,
        remaining_sessions,
        status
      ),
      attendance (
        status
      )
    `)
    .eq("assigned_trainer_id", trainer.id)
    .eq("status", "ACTIVE");

  if (filter === "pt") memberQuery = memberQuery.eq("member_type", "PT");
  if (filter === "normal") memberQuery = memberQuery.eq("member_type", "NORMAL");

  const { data: members } = await memberQuery;

  const filteredMembers = members?.filter((m: any) => {
    if (!query) return true;
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return profile?.full_name?.toLowerCase().includes(query.toLowerCase());
  }) || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Tabs */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            My Assigned Athletes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Athletes assigned to you for floor guidance, workout planning, and dedicated PT.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(["all", "pt", "normal"] as const).map((tab) => (
            <Link
              key={tab}
              href={`/trainer/members?filter=${tab}`}
              className={`h-8 px-3.5 rounded text-xs font-semibold transition-colors flex items-center ${
                filter === tab
                  ? "bg-[#1E40AF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab === "all" ? "All Athletes" : tab === "pt" ? "PT Members" : "General"}
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((m: any) => {
            const isPt = m.member_type === "PT";
            const activePkg = m.pt_packages?.find((p: any) => p.status === "ACTIVE");
            const attendanceTotal = m.attendance?.length || 0;
            const presentCount = m.attendance?.filter((a: any) => a.status === "PRESENT").length || 0;
            const attendancePct = attendanceTotal ? Math.round((presentCount / attendanceTotal) * 100) : 0;
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;

            return (
              <div
                key={m.id}
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-[#1E40AF] transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold flex items-center justify-center text-xs">
                        {profile?.full_name?.slice(0, 2).toUpperCase() || "MB"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{profile?.full_name || "Athlete"}</h3>
                        <span className="text-xs text-slate-400 block">{profile?.phone || "No phone"}</span>
                      </div>
                    </div>

                    {isPt ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        PT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        General
                      </span>
                    )}
                  </div>

                  {m.medical_conditions && (
                    <div className="mt-3 p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      Note: {m.medical_conditions}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Attendance</span>
                      <span className="font-bold text-slate-900 tabular-nums">{attendancePct}%</span>
                    </div>

                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        {isPt ? "PT Progress" : "Plan Expiry"}
                      </span>
                      {isPt && activePkg ? (
                        <span className="font-bold text-amber-800 font-mono tabular-nums">
                          {activePkg.used_sessions}/{activePkg.total_sessions}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {formatDate(m.membership_expiry)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/trainer/members/${m.id}`}
                  className="w-full h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Floor Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            No athletes assigned under this category.
          </div>
        )}
      </div>
    </div>
  );
}
