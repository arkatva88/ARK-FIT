import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Users, CalendarCheck } from "lucide-react";

export default async function OwnerReportsPage() {
  const supabase = createClient();

  // Fetch metrics
  const { data: members } = await supabase.from("members").select("member_type, status");
  const { data: payments } = await supabase.from("payments").select("amount, status, payment_method, created_at");
  const { data: attendance } = await supabase.from("attendance").select("status, attendance_date");

  const totalMembers = members?.length || 0;
  const ptCount = members?.filter((m) => m.member_type === "PT").length || 0;
  const normalCount = totalMembers - ptCount;

  const totalCollected = payments?.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const cashCollected = payments?.filter((p) => p.status === "PAID" && p.payment_method === "CASH").reduce((s, p) => s + Number(p.amount), 0) || 0;
  const upiCollected = payments?.filter((p) => p.status === "PAID" && p.payment_method === "UPI").reduce((s, p) => s + Number(p.amount), 0) || 0;
  const razorpayCollected = payments?.filter((p) => p.status === "PAID" && p.payment_method === "RAZORPAY").reduce((s, p) => s + Number(p.amount), 0) || 0;
  const presentCheckins = attendance?.filter((a) => a.status === "PRESENT").length || 0;

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Gym Business & Financial Reports
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Revenue settlement breakdown, member distribution, and monthly check-in volume.
        </p>
      </section>

      {/* Revenue Breakdown */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" /> Revenue & Collections
          </h2>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">{formatCurrency(totalCollected)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded border border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase block">UPI / QR Collections</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block tabular-nums">{formatCurrency(upiCollected)}</span>
          </div>

          <div className="p-4 rounded border border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase block">Cash Collections</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block tabular-nums">{formatCurrency(cashCollected)}</span>
          </div>

          <div className="p-4 rounded border border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase block">Online Razorpay</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block tabular-nums">{formatCurrency(razorpayCollected)}</span>
          </div>
        </div>
      </div>

      {/* Athlete Distribution & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E40AF]" /> Athlete Distribution
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-900">General Gym Members</span>
                <span className="text-slate-500">{normalCount} ({totalMembers ? Math.round((normalCount / totalMembers) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#1E40AF] rounded-full"
                  style={{ width: `${totalMembers ? (normalCount / totalMembers) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-800">Personal Training (PT)</span>
                <span className="text-amber-800">{ptCount} ({totalMembers ? Math.round((ptCount / totalMembers) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalMembers ? (ptCount / totalMembers) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" /> Floor Activity Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Total Recorded Check-ins</span>
              <span className="font-bold text-slate-900 tabular-nums">{presentCheckins} check-ins</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Active PT Roster Ratio</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {totalMembers ? Math.round((ptCount / totalMembers) * 100) : 0}% of all members
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
