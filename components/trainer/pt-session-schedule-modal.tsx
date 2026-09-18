"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Plus, X, Loader2, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";

export interface ActivePtPackageOption {
  id: string;
  memberId: string;
  memberName: string;
  phone?: string;
  totalSessions: number;
  remainingSessions: number;
}

interface PtSessionScheduleModalProps {
  packages: ActivePtPackageOption[];
  defaultPackageId?: string;
  triggerButtonText?: string;
}

export function PtSessionScheduleModal({
  packages,
  defaultPackageId,
  triggerButtonText = "Schedule PT Session",
}: PtSessionScheduleModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId || packages[0]?.id || "");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [sessionDate, setSessionDate] = useState(tomorrow);
  const [sessionTime, setSessionTime] = useState("10:00");
  const [workoutNotes, setWorkoutNotes] = useState("");

  const isSubmittingRef = useRef(false);

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  const handleOpen = () => {
    setError(null);
    setSuccess(false);
    if (!selectedPackageId && packages.length > 0) {
      setSelectedPackageId(packages[0].id);
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!selectedPackageId) {
      setError("Please select a member PT package");
      return;
    }

    if (!sessionDate || !sessionTime) {
      setError("Please specify session date and time");
      return;
    }

    if (selectedPkg && selectedPkg.remainingSessions <= 0) {
      setError("Selected member has 0 remaining sessions in their PT package");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pt/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCHEDULE",
          packageId: selectedPackageId,
          sessionDate,
          sessionTime,
          workoutNotes: workoutNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule PT session");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to schedule PT session");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{triggerButtonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900">Schedule Personal Training Session</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {packages.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                  No active PT packages found. Please ensure members have an active PT subscription assigned.
                </div>
              ) : (
                <>
                  {/* Select Member Package */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Athlete / PT Package
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      disabled={loading}
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.memberName} ({pkg.remainingSessions} of {pkg.totalSessions} sessions left)
                        </option>
                      ))}
                    </select>
                    {selectedPkg && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Remaining Quota: <strong>{selectedPkg.remainingSessions} sessions</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date and Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Session Date
                      </label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      />
                    </div>
                  </div>

                  {/* Routine Focus / Notes */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Workout Focus / Routine Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                      disabled={loading}
                      placeholder="e.g., Chest & Triceps hypertrophy, Bench press form analysis"
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                    />
                  </div>
                </>
              )}

              {/* Error state */}
              {error && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success state */}
              {success && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>PT Session scheduled! Quota updated & notification sent.</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-8 px-3 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || packages.length === 0 || (selectedPkg && selectedPkg.remainingSessions <= 0)}
                  className="h-8 px-4 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <span>Confirm Session</span>
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
