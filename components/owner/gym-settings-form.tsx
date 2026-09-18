"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, Save, Loader2, AlertCircle, CheckCircle2, Globe, Clock } from "lucide-react";

interface GymSettingsFormProps {
  gym: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    currency?: string;
    timezone?: string;
  } | null;
}

export function GymSettingsForm({ gym }: GymSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(gym?.name || "ARK FIT");
  const [phone, setPhone] = useState(gym?.phone || "+91 98765 43210");
  const [address, setAddress] = useState(gym?.address || "123 Fitness Boulevard, Koramangala, Bangalore, India");
  const [currency, setCurrency] = useState(gym?.currency || "INR");
  const [timezone, setTimezone] = useState(gym?.timezone || "Asia/Kolkata");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!name.trim()) {
      setError("Gym name is required");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/gyms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          currency,
          timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save gym settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#1E40AF]" /> Gym Profile & Locale Configuration
        </h2>
        <span className="text-[11px] text-slate-500">Tenant Settings</span>
      </div>

      {error && (
        <div className="p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Gym settings and locale preferences updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Gym Name */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Gym Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Contact Phone / WhatsApp
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          />
        </div>

        {/* Currency Setting */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#1E40AF]" /> Operating Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={loading}
            className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          >
            <option value="INR">INR (₹) — Indian Rupee</option>
            <option value="USD">USD ($) — US Dollar</option>
            <option value="EUR">EUR (€) — Euro</option>
            <option value="GBP">GBP (£) — British Pound</option>
            <option value="AED">AED (د.إ) — UAE Dirham</option>
            <option value="SGD">SGD (S$) — Singapore Dollar</option>
            <option value="AUD">AUD (A$) — Australian Dollar</option>
            <option value="CAD">CAD (C$) — Canadian Dollar</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Used across ledger, member fee calculations, invoices, and payment orders.
          </p>
        </div>

        {/* Timezone Setting */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#1E40AF]" /> Operating Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={loading}
            className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET - UTC+01:00)</option>
            <option value="America/New_York">America/New_York (EST/EDT - UTC-05:00)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT - UTC-08:00)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST - UTC+10:00)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Controls floor check-in dates, schedule windows, and automated reminder timings.
          </p>
        </div>

        {/* Gym Address */}
        <div className="sm:col-span-2">
          <label className="block text-slate-600 font-semibold mb-1">
            Gym Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            placeholder="e.g. 123 Fitness Boulevard, Koramangala, Bangalore"
            className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-3 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-4 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
