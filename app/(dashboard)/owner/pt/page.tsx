import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { PtPackageModal } from "@/components/owner/pt-package-modal";

interface PageProps {
  searchParams: {
    filter?: string;
  };
}

export default async function OwnerPtPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const filter = searchParams.filter || "all";
  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch PT Packages
  let pkgQuery = supabase
    .from("pt_packages")
    .select(`
      id,
      package_name,
      total_sessions,
      used_sessions,
      remaining_sessions,
      price,
      start_date,
      expiry_date,
      status,
      members (
        id,
        profiles (
          full_name,
          phone
        )
      ),
      trainers (
        id,
        profiles (
          full_name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (filter === "low_sessions") {
    pkgQuery = pkgQuery.lte("remaining_sessions", 2).eq("status", "ACTIVE");
  }

  const { data: ptPackages } = await pkgQuery;

  // 2. Fetch Today's PT Sessions
  const { data: todaySessions } = await supabase
    .from("pt_sessions")
    .select(`
      id,
      session_number,
      session_date,
      session_time,
      status,
      workout_notes,
      trainer_notes,
      members (
        profiles (full_name)
      ),
      trainers (
        profiles (full_name)
      )
    `)
    .eq("session_date", today)
    .order("session_time", { ascending: true });

  // 3. Stats Calculation
  const activePtMembersCount = ptPackages?.filter((p) => p.status === "ACTIVE").length || 0;
  const sessionsTodayCount = todaySessions?.length || 0;
  const sessionsCompletedCount = todaySessions?.filter((s) => s.status === "COMPLETED").length || 0;
  const totalSessionsRemaining = ptPackages
    ?.filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + p.remaining_sessions, 0) || 0;

  // Fetch trainers and PT members for package modal
  const { data: trainers } = await supabase.from("trainers").select("id, profiles(full_name)").eq("is_active", true);
  const { data: ptMembers } = await supabase.from("members").select("id, profiles(full_name)").eq("member_type", "PT");

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Issue Package CTA */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Training Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage coach allocations, track active 1-on-1 session quotas, and oversee floor appointments.
          </p>
        </div>

        <PtPackageModal
          trainers={trainers || []}
          ptMembers={ptMembers || []}
        />
      </section>

      {/* 2. Four Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active PT Members */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active PT Members</span>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{activePtMembersCount}</div>
          <p className="text-xs text-slate-500 mt-1">Dedicated 1-on-1 clients</p>
        </div>

        {/* Card 2: Today's PT Sessions */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Today's Sessions</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {sessionsCompletedCount} / {sessionsTodayCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Completed today on gym floor</p>
        </div>

        {/* Card 3: Sessions Remaining */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Remaining Quota</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">{totalSessionsRemaining}</div>
          <p className="text-xs text-slate-500 mt-1">Unused training sessions</p>
        </div>

        {/* Card 4: Coaches on Floor */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Coaches</span>
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{trainers?.length || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Certified personal trainers</p>
        </div>
      </section>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2">
        <Link
          href="/owner/pt"
          className={`h-8 px-3.5 rounded text-xs font-semibold transition-colors flex items-center ${
            filter === "all"
              ? "bg-[#1E40AF] text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Active Packages
        </Link>
        <Link
          href="/owner/pt?filter=low_sessions"
          className={`h-8 px-3.5 rounded text-xs font-semibold transition-colors flex items-center ${
            filter === "low_sessions"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-amber-700 hover:text-amber-900 border border-amber-200 hover:bg-amber-50"
          }`}
        >
          Low Sessions (≤ 2 left)
        </Link>
      </div>

      {/* 4. PT Packages Ledger */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Member</th>
              <th className="px-5 py-3">Assigned Coach</th>
              <th className="px-5 py-3">Package Details</th>
              <th className="px-5 py-3">Sessions Balance</th>
              <th className="px-5 py-3">Fee Paid</th>
              <th className="px-5 py-3">Valid Until</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ptPackages && ptPackages.length > 0 ? (
              ptPackages.map((p: any) => {
                const memberProfile = Array.isArray(p.members?.profiles) ? p.members?.profiles[0] : p.members?.profiles;
                const trainerProfile = Array.isArray(p.trainers?.profiles) ? p.trainers?.profiles[0] : p.trainers?.profiles;
                const isLow = p.remaining_sessions <= 2 && p.status === "ACTIVE";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/members/${p.members?.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-700 block text-sm"
                      >
                        {memberProfile?.full_name || "Unknown Athlete"}
                      </Link>
                      <span className="text-xs text-slate-400 block">{memberProfile?.phone || "No phone"}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {trainerProfile?.full_name || "Unassigned"}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {p.package_name}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold tabular-nums text-sm ${isLow ? "text-amber-700" : "text-slate-900"}`}>
                          {p.remaining_sessions} left
                        </span>
                        <span className="text-xs text-slate-400">/ {p.total_sessions}</span>
                      </div>
                      {isLow && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Renewal Needed
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">
                      {formatCurrency(p.price)}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {formatDate(p.expiry_date)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No personal training packages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
