"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Loader2 } from "lucide-react";

interface PtPackageModalProps {
  trainers: any[];
  ptMembers: any[];
}

export function PtPackageModal({ trainers, ptMembers }: PtPackageModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [packageName, setPackageName] = useState("12 Sessions PT Package");
  const [totalSessions, setTotalSessions] = useState("12");
  const [price, setPrice] = useState("6000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!memberId || !trainerId) {
      setError("Please select both a PT Member and an Assigned Coach");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const numSessions = parseInt(totalSessions, 10);
      const startDate = new Date().toISOString().split("T")[0];
      const expiryDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Insert PT package
      const { error: pkgErr } = await supabase
        .from("pt_packages")
        .insert({
          gym_id: member.gym_id,
          member_id: memberId,
          trainer_id: trainerId,
          package_name: packageName,
          total_sessions: numSessions,
          used_sessions: 0,
          remaining_sessions: numSessions,
          price: parseFloat(price),
          start_date: startDate,
          expiry_date: expiryDate,
          status: "ACTIVE",
        });

      if (pkgErr) throw pkgErr;

      // Update member trainer
      await supabase
        .from("members")
        .update({ assigned_trainer_id: trainerId })
        .eq("id", memberId);

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create PT package");
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
        <Plus className="w-4 h-4" /> Issue PT Package
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
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Issue Personal Training Package</h2>
              <p className="text-xs text-slate-500 mt-1">
                Allocate a dedicated coach and session quota to an enrolled PT member.
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
                  PT Member *
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                >
                  <option value="">Select PT member...</option>
                  {ptMembers.map((m) => {
                    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                    return (
                      <option key={m.id} value={m.id}>
                        {prof?.full_name || "Unknown Member"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Coach *
                </label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                >
                  <option value="">Assign fitness coach...</option>
                  {trainers.map((t) => {
                    const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                    return (
                      <option key={t.id} value={t.id}>
                        {prof?.full_name || "Coach"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Package Name
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Sessions
                  </label>
                  <input
                    type="number"
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(e.target.value)}
                    required
                    min="1"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-700"
                  />
                </div>
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
                      <span>Creating Package...</span>
                    </>
                  ) : (
                    "Create Package"
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
