import { createClient } from "@/lib/supabase/server";
import { CreditCard, Mail, Building } from "lucide-react";

export default async function OwnerSettingsPage() {
  const supabase = createClient();
  const { data: gym } = await supabase.from("gyms").select("*").single();

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Gym Settings & Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage gym identity, payment gateway configuration, and transactional notification channels.
        </p>
      </section>

      {/* Gym Identity */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#1E40AF]" /> Gym Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">Gym Name</label>
            <input
              type="text"
              readOnly
              value={gym?.name || "ARK FIT"}
              className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">Contact Phone</label>
            <input
              type="text"
              readOnly
              value={gym?.phone || "+91 98765 43210"}
              className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">Gym Address</label>
            <input
              type="text"
              readOnly
              value={gym?.address || "123 Fitness Boulevard, Koramangala, Bangalore, India"}
              className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Razorpay Gateway */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Razorpay Online Payments
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Integrated server-side with HMAC-SHA256 signature verification. Key secrets are securely loaded via <code className="text-[#1E40AF] font-mono">.env.local</code> and are never leaked to client bundles.
        </p>

        <div className="p-3 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Razorpay test mode keys active. Order creation, client-side checkout modal, and verification routes are operational.
        </div>
      </div>

      {/* SMTP Email Reminders Placeholder */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#1E40AF]" /> Automated SMTP Reminders
          </h2>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase">
            Awaiting SMTP Credentials
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Automated payment reminders and expiring membership notices via email/SMTP. Provide your SMTP server host, port, user, and pass when ready to activate automated transactional email delivery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <input
            type="text"
            disabled
            placeholder="SMTP Host (e.g. smtp.gmail.com / smtp.resend.com)"
            className="w-full h-9 px-3 rounded bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed text-xs"
          />
          <input
            type="text"
            disabled
            placeholder="SMTP Port (e.g. 587)"
            className="w-full h-9 px-3 rounded bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed text-xs"
          />
        </div>
      </div>
    </div>
  );
}
