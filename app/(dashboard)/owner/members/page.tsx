import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Users, Search, Plus, Target, Phone, ArrowUpRight } from "lucide-react";
import { MemberClientModal } from "@/components/owner/member-client-modal";

interface PageProps {
  searchParams: {
    q?: string;
    filter?: string;
    trainer?: string;
    page?: string;
    new?: string;
  };
}

export default async function OwnerMembersPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const query = searchParams.q || "";
  const filter = searchParams.filter || "all";
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  // Base query
  let memberQuery = supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      membership_expiry,
      created_at,
      profiles!inner (
        full_name,
        phone,
        avatar_url
      ),
      assigned_trainer:trainers (
        id,
        profiles (full_name)
      )
    `, { count: "exact" });

  // Apply filters
  if (filter === "active") {
    memberQuery = memberQuery.eq("status", "ACTIVE");
  } else if (filter === "expired") {
    memberQuery = memberQuery.or(`status.eq.EXPIRED,membership_expiry.lt.${today}`);
  } else if (filter === "expiring") {
    memberQuery = memberQuery
      .eq("status", "ACTIVE")
      .gte("membership_expiry", today)
      .lte("membership_expiry", sevenDaysStr);
  } else if (filter === "pt") {
    memberQuery = memberQuery.eq("member_type", "PT");
  } else if (filter === "normal") {
    memberQuery = memberQuery.eq("member_type", "NORMAL");
  }

  // Live text search
  if (query) {
    memberQuery = memberQuery.ilike("profiles.full_name", `%${query}%`);
  }

  const { data: members, count } = await memberQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  // Fetch trainers for member assignment modal
  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, profiles(full_name)")
    .eq("is_active", true);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar Area (From Stitch) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Members Directory</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1E40AF]">
              {count || 0} Registered
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active memberships and floor athletic rosters · Your Gym. Simplified.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MemberClientModal
            trainers={(trainers as any) || []}
            isOpenDefault={searchParams.new === "true"}
          />
        </div>
      </div>

      {/* 2. Search & Filter Control Hub */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Live Search Bar */}
          <form className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search member by name, phone, or ID..."
              className="w-full h-9 pl-9 pr-4 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Members" },
              { id: "active", label: "Active" },
              { id: "expiring", label: "Expiring ≤ 7d" },
              { id: "expired", label: "Expired" },
              { id: "pt", label: "PT Athletes" },
              { id: "normal", label: "Normal" },
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/owner/members?filter=${tab.id}${query ? `&q=${query}` : ""}`}
                  className={`px-3 py-1.5 rounded font-medium text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#1E40AF] text-white shadow-sm"
                      : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Members Data Table with Universal Horizontal Scroll */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-sm min-w-[680px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="px-6 py-3.5">Athlete</th>
                <th className="px-6 py-3.5">Member Type</th>
                <th className="px-6 py-3.5">Assigned Coach</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Expiry Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {members && members.length > 0 ? (
                members.map((member: any) => {
                  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                  const trainer = Array.isArray(member.assigned_trainer) ? member.assigned_trainer[0] : member.assigned_trainer;
                  const trainerProfile = Array.isArray(trainer?.profiles) ? trainer?.profiles[0] : trainer?.profiles;

                  const isPt = member.member_type === "PT";
                  const isExpired = member.membership_expiry && member.membership_expiry < today;

                  return (
                    <tr key={member.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#DBEAFE] text-[#1E40AF] font-bold flex items-center justify-center text-xs border border-[#BFDBFE]">
                            {profile?.full_name?.slice(0, 2).toUpperCase() || "MB"}
                          </div>
                          <div>
                            <span className="font-semibold text-[#0F172A] text-xs block">{profile?.full_name || "Member"}</span>
                            <span className="text-[11px] text-[#64748B] block">{profile?.phone || "No phone"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {isPt ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                            <Target className="w-3 h-3 text-amber-700" /> PT Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-[11px] font-medium">
                            Normal Member
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-xs text-[#0F172A] font-medium whitespace-nowrap">
                        {trainerProfile?.full_name || "— None assigned —"}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            member.status === "ACTIVE" && !isExpired
                              ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]"
                              : "bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C]"
                          }`}
                        >
                          {isExpired ? "EXPIRED" : member.status}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-xs font-mono font-medium text-[#0F172A] whitespace-nowrap">
                        {formatDate(member.membership_expiry)}
                      </td>

                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/owner/members/${member.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40AF] hover:underline"
                        >
                          Profile &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] text-xs">
                    No athletes found matching the selected filter criteria.
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
