import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RazorpayPayButton } from "@/components/member/razorpay-pay-button";

export default async function MemberPaymentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select(`
      id,
      membership_expiry,
      status,
      profiles (
        full_name,
        phone
      )
    `)
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();

  // Concurrently fetch Member's latest membership plan and payment history in a single roundtrip
  const [
    { data: membership },
    { data: payments }
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
  ]);

  const renewalAmount = membership?.amount || 1500;

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Membership Dues & Invoices
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review your gym subscription validity and renew your membership securely online via Razorpay.
        </p>
      </section>

      {/* Active Membership Banner */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Subscription</span>
            <h2 className="text-lg font-bold text-slate-900">{membership?.plan_name || "Monthly All-Access"}</h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              Valid until: <strong className="text-slate-800">{formatDate(member.membership_expiry)}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{formatCurrency(renewalAmount)}</span>
            <RazorpayPayButton
              membershipId={membership?.id}
              amount={renewalAmount}
              planName={membership?.plan_name || "Monthly Gym Fee"}
            />
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment History</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {payments && payments.length > 0 ? (
            payments.map((p: any) => {
              const isPaid = p.status === "PAID";

              return (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{p.notes || "Gym Membership Fee"}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDate(p.created_at)} • Method: {p.payment_method}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block font-mono tabular-nums">
                      {formatCurrency(p.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-8 text-center text-slate-400 text-xs italic">
              No previous payment transactions recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
