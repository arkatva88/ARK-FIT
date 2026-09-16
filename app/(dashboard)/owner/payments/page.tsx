import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { PaymentModal } from "@/components/owner/payment-modal";
import { PaymentRemindButton } from "@/components/owner/payment-remind-button";

interface PageProps {
  searchParams: {
    status?: string;
    new?: string;
  };
}

export default async function OwnerPaymentsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const statusFilter = searchParams.status || "all";

  // Financial Stats
  const { data: allPayments } = await supabase.from("payments").select("amount, status, due_date, paid_at");

  const collected = allPayments
    ?.filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const pending = allPayments
    ?.filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const overdue = allPayments
    ?.filter((p) => p.status === "OVERDUE")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Payments Query
  let query = supabase
    .from("payments")
    .select(`
      id,
      amount,
      currency,
      payment_method,
      status,
      due_date,
      paid_at,
      notes,
      razorpay_order_id,
      razorpay_payment_id,
      created_at,
      members (
        id,
        member_type,
        profiles (
          full_name,
          phone
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: payments } = await query;

  // Fetch active members for recording manual payments
  const { data: activeMembers } = await supabase
    .from("members")
    .select("id, profiles(full_name)")
    .eq("status", "ACTIVE");

  const filterTabs = [
    { label: "All Payments", id: "all" },
    { label: "Paid", id: "PAID" },
    { label: "Pending", id: "PENDING" },
    { label: "Overdue", id: "OVERDUE" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Record Payment CTA */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Fees & Payments Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor gym membership fees, record cash/UPI collections, and review online Razorpay settlements.
          </p>
        </div>

        <PaymentModal members={activeMembers || []} />
      </section>

      {/* 2. Three Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Collected */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Collected</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">{formatCurrency(collected)}</div>
          <p className="text-xs text-slate-500 mt-1">Settled via Cash, UPI & Razorpay</p>
        </div>

        {/* Card 2: Pending Fees */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Fees</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">{formatCurrency(pending)}</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting member renewal payment</p>
        </div>

        {/* Card 3: Overdue Fees */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue Fees</span>
            <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 tabular-nums">{formatCurrency(overdue)}</div>
          <p className="text-xs text-slate-500 mt-1">Expired membership renewals</p>
        </div>
      </section>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/owner/payments?status=${tab.id}`}
            className={`h-8 px-3.5 rounded text-xs font-semibold transition-colors whitespace-nowrap flex items-center ${
              statusFilter === tab.id
                ? "bg-[#1E40AF] text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* 4. Payments Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Member</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date / Due</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments && payments.length > 0 ? (
              payments.map((p: any) => {
                const memberProfile = Array.isArray(p.members?.profiles) ? p.members?.profiles[0] : p.members?.profiles;
                const isPaid = p.status === "PAID";
                const isOverdue = p.status === "OVERDUE";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/members/${p.members?.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-700 block text-sm"
                      >
                        {memberProfile?.full_name || "Unknown"}
                      </Link>
                      <span className="text-xs text-slate-400 block">{memberProfile?.phone || "No phone"}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {p.notes || "Monthly Membership"}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-medium text-slate-700">
                        {p.payment_method}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isOverdue
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {isPaid ? `Paid ${formatDate(p.paid_at)}` : `Due ${formatDate(p.due_date)}`}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {!isPaid && (
                        <PaymentRemindButton memberName={memberProfile?.full_name || "Member"} />
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
