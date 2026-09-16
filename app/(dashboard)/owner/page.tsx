import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Target,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 30; // 30s revalidation for dashboard metrics

export default async function OwnerDashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  // 1. Fetch Quick Metric Counters
  const { count: activeMembersCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const { count: todayAttendanceCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("check_in_date", today);

  // 2. Fetch Payments for Month Revenue & Pending
  const { data: monthPayments } = await supabase
    .from("payments")
    .select("amount, status, due_date, paid_at")
    .gte("due_date", startOfMonth);

  const totalCollected =
    monthPayments
      ?.filter((p) => p.status === "PAID")
      .reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0) || 0;

  const totalPending =
    monthPayments
      ?.filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
      .reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0) || 0;

  // 3. ACTION REQUIRED 1: Expiring in <= 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  const { data: expiringMembers } = await supabase
    .from("members")
    .select("id, status, membership_expiry, profiles(full_name, phone)")
    .eq("status", "ACTIVE")
    .gte("membership_expiry", today)
    .lte("membership_expiry", sevenDaysStr)
    .limit(5);

  // 4. ACTION REQUIRED 2: Pending Payments
  const { data: pendingPaymentsList } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      due_date,
      members (
        id,
        profiles (full_name, phone)
      )
    `)
    .in("status", ["PENDING", "OVERDUE"])
    .order("due_date", { ascending: true })
    .limit(5);

  // 5. ACTION REQUIRED 3: PT Packages with <= 2 sessions left
  const { data: lowSessionPtPackages } = await supabase
    .from("pt_packages")
    .select(`
      id,
      total_sessions,
      used_sessions,
      remaining_sessions,
      members (
        id,
        profiles (full_name)
      )
    `)
    .eq("status", "ACTIVE")
    .lte("remaining_sessions", 2)
    .limit(5);

  // 6. Today's Scheduled PT Sessions
  const { data: todayPtSessions } = await supabase
    .from("pt_sessions")
    .select(`
      id,
      session_number,
      session_date,
      session_time,
      status,
      members (
        id,
        profiles (full_name)
      ),
      trainers (
        id,
        profiles (full_name)
      )
    `)
    .eq("session_date", today)
    .order("session_time", { ascending: true })
    .limit(6);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Sub-header Greeting Banner (From Stitch) */}
      <div className="bg-white border border-[#E2E8F0] p-4 lg:p-5 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
            Good morning · Gym Owner Command
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            ARK FIT: Koramangala 5th Block · Real-time Operational Desk
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded">
            <Calendar className="w-3.5 h-3.5 text-[#1E40AF]" />
            <span className="font-semibold text-[#0F172A]">{formattedDate}</span>
          </div>

          <Link
            href="/owner/members?new=true"
            className="h-8 px-3.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+ Add Member</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Clean Metric Cards Grid (4 Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Active Members */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Members</span>
            <Users className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">
            {activeMembersCount || 0}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <span className="text-[#0D9488] font-semibold">Active Roster</span>
            <Link href="/owner/members" className="text-[#1E40AF] hover:underline font-medium">
              View All &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 2: Today's Check-ins */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Check-ins</span>
            <CalendarCheck className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">
            {todayAttendanceCount || 0}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Recorded Today</span>
            <Link href="/owner/attendance" className="text-[#1E40AF] hover:underline font-medium">
              Check-in Desk &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 3: Monthly Collected Revenue */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Collected (Month)</span>
            <CreditCard className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0D9488] font-mono">
            {formatCurrency(totalCollected)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Cash / UPI / Online</span>
            <Link href="/owner/payments" className="text-[#1E40AF] hover:underline font-medium">
              Ledger &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 4: Pending Dues */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Dues</span>
            <AlertTriangle className="w-4 h-4 text-[#BE123C]" />
          </div>
          <div className="text-2xl font-bold text-[#BE123C] font-mono">
            {formatCurrency(totalPending)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <span className="text-[#BE123C] font-medium">{pendingPaymentsList?.length || 0} Accounts Due</span>
            <Link href="/owner/payments?status=PENDING" className="text-[#1E40AF] hover:underline font-medium">
              Collect &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTION REQUIRED TODAY (3 Crisp Highlight Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B45309] animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Action Required Today
            </h2>
          </div>
          <span className="text-[11px] text-[#64748B]">Priority items needing floor follow-up</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Expiring Memberships */}
          <div className="p-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                  Expiring in ≤ 7 Days
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#FDE68A] text-[#B45309] font-bold text-xs">
                  {expiringMembers?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-3">
                Due for membership renewal this week.
              </p>

              <div className="space-y-1.5">
                {expiringMembers && expiringMembers.length > 0 ? (
                  expiringMembers.map((m: any) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                    return (
                      <div key={m.id} className="text-xs flex items-center justify-between py-1 border-b border-[#FDE68A]/60 last:border-0">
                        <span className="text-[#0F172A] font-semibold truncate">{profile?.full_name || "Athlete"}</span>
                        <span className="text-[#B45309] font-mono font-bold shrink-0">{formatDate(m.membership_expiry)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#64748B] italic py-1">No memberships expiring this week.</p>
                )}
              </div>
            </div>

            <Link
              href="/owner/members?filter=expiring"
              className="mt-3 pt-2.5 border-t border-[#FDE68A] text-xs font-semibold text-[#B45309] hover:underline flex items-center justify-between"
            >
              <span>Renew Memberships</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Pending Payments */}
          <div className="p-4 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#BE123C] uppercase tracking-wider">
                  Pending Fees
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#FECDD3] text-[#BE123C] font-bold text-xs">
                  {pendingPaymentsList?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-3">
                Uncollected dues awaiting cash, UPI or Razorpay.
              </p>

              <div className="space-y-1.5">
                {pendingPaymentsList && pendingPaymentsList.length > 0 ? (
                  pendingPaymentsList.map((p: any) => {
                    const memberProfile = Array.isArray(p.members?.profiles) ? p.members?.profiles[0] : p.members?.profiles;
                    return (
                      <div key={p.id} className="text-xs flex items-center justify-between py-1 border-b border-[#FECDD3]/60 last:border-0">
                        <span className="text-[#0F172A] font-semibold truncate">{memberProfile?.full_name || "Athlete"}</span>
                        <span className="text-[#BE123C] font-mono font-bold shrink-0">{formatCurrency(p.amount)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#64748B] italic py-1">No overdue fees pending.</p>
                )}
              </div>
            </div>

            <Link
              href="/owner/payments?status=PENDING"
              className="mt-3 pt-2.5 border-t border-[#FECDD3] text-xs font-semibold text-[#BE123C] hover:underline flex items-center justify-between"
            >
              <span>Collect Pending Fees</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: PT Sessions Low */}
          <div className="p-4 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">
                  PT Packages ≤ 2 Left
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#BFDBFE] text-[#1E40AF] font-bold text-xs">
                  {lowSessionPtPackages?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-3">
                Clients running low on session quota.
              </p>

              <div className="space-y-1.5">
                {lowSessionPtPackages && lowSessionPtPackages.length > 0 ? (
                  lowSessionPtPackages.map((pkg: any) => {
                    const memberProfile = Array.isArray(pkg.members?.profiles) ? pkg.members?.profiles[0] : pkg.members?.profiles;
                    return (
                      <div key={pkg.id} className="text-xs flex items-center justify-between py-1 border-b border-[#BFDBFE]/60 last:border-0">
                        <span className="text-[#0F172A] font-semibold truncate">{memberProfile?.full_name || "Athlete"}</span>
                        <span className="text-[#1E40AF] font-mono font-bold shrink-0">
                          {pkg.remaining_sessions} / {pkg.total_sessions} Left
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#64748B] italic py-1">All PT packages have adequate balance.</p>
                )}
              </div>
            </div>

            <Link
              href="/owner/pt?filter=low_sessions"
              className="mt-3 pt-2.5 border-t border-[#BFDBFE] text-xs font-semibold text-[#1E40AF] hover:underline flex items-center justify-between"
            >
              <span>Renew PT Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 3: Today's Scheduled PT Floor Sessions */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">
              Today's Scheduled PT Floor Sessions
            </h3>
          </div>
          <Link href="/owner/pt" className="text-xs font-semibold text-[#1E40AF] hover:underline">
            Open PT Desk &rarr;
          </Link>
        </div>

        {todayPtSessions && todayPtSessions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayPtSessions.map((session: any) => {
              const memberProfile = Array.isArray(session.members?.profiles) ? session.members?.profiles[0] : session.members?.profiles;
              const trainerProfile = Array.isArray(session.trainers?.profiles) ? session.trainers?.profiles[0] : session.trainers?.profiles;
              return (
                <div key={session.id} className="p-3.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{memberProfile?.full_name || "Athlete"}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#64748B] font-mono">
                        #{session.session_number}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Coach: {trainerProfile?.full_name || "Assigned Trainer"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#1E40AF] block">{session.session_time.slice(0, 5)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${session.status === "COMPLETED" ? "text-[#0D9488]" : "text-[#B45309]"}`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[#64748B] text-xs border border-dashed border-[#E2E8F0] rounded">
            No PT floor appointments scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
}
