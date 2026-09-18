"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Loader2 } from "lucide-react";

interface PaymentModalProps {
  members: any[];
}

export function PaymentModal({ members }: PaymentModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("1500");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "RAZORPAY">("CASH");
  const [notes, setNotes] = useState("Monthly Membership Fee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!memberId) {
      setError("Please select a member");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/record-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          amount: parseFloat(amount),
          paymentMethod,
          notes,
          durationDays: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 px-4 bg-[#1E40AF] text-white hover:bg-blue-800 font-medium text-sm rounded shadow-sm flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Record Fee Collection</h2>
              <p className="text-xs text-slate-500 mt-1">
                Record manual counter payments received via Cash, UPI, or external card terminal.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Member *
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                >
                  <option value="">Select gym member...</option>
                  {members.map((m) => {
                    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                    return (
                      <option key={m.id} value={m.id}>
                        {prof?.full_name || "Unknown Member"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  >
                    <option value="CASH">Cash (Counter)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="RAZORPAY">Razorpay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Description
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  placeholder="e.g. Monthly Fee, PT Package"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-9 px-4 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Recording Payment...</span>
                    </>
                  ) : (
                    "Save Payment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
