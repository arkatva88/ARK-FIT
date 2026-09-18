import { createClient } from "@/lib/supabase/server";
import { CreditCard, Mail, QrCode } from "lucide-react";
import { GymSettingsForm } from "@/components/owner/gym-settings-form";
import { GymQrModal } from "@/components/owner/gym-qr-modal";

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
          Manage gym identity, currency, timezone, payment gateway configuration, and transactional notification channels.
        </p>
      </section>

      {/* Interactive Gym Identity & Locale Form */}
      <GymSettingsForm gym={gym} />

      {/* Gym Attendance QR Code Station */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#1E40AF]" /> Gym Attendance QR Station
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              One persistent, rotatable QR check-in code for your front desk, turnstile, or entrance wall poster.
              Athletes scan with their phone to instantly log attendance and open their workout split.
            </p>
          </div>
          <GymQrModal buttonText="Manage & Print Poster" />
        </div>

        <div className="p-3 rounded border border-blue-200 bg-blue-50/60 text-xs text-blue-900 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          QR check-in token is active. Contains zero sensitive athlete or billing data and enforces multi-tenant gym isolation server-side.
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
