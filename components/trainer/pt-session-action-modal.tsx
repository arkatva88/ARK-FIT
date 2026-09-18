"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, X, Loader2, AlertCircle, CheckCircle2, RotateCcw, Ban } from "lucide-react";

interface PtSessionActionModalProps {
  session: {
    id: string;
    sessionNumber: number;
    sessionDate: string;
    sessionTime: string;
    memberName: string;
  };
}

export function PtSessionActionModal({ session }: PtSessionActionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"RESCHEDULE" | "CANCEL">("RESCHEDULE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reschedule state
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [newDate, setNewDate] = useState(tomorrow);
  const [newTime, setNewTime] = useState(session.sessionTime ? session.sessionTime.slice(0, 5) : "10:00");
  const [rescheduleNotes, setRescheduleNotes] = useState("");

  // Cancel state
  const [restoreQuota, setRestoreQuota] = useState(true);
  const [cancelNotes, setCancelNotes] = useState("Member requested cancellation with advance notice.");

  const isSubmittingRef = useRef(false);

  const handleOpen = (m: "RESCHEDULE" | "CANCEL") => {
    setMode(m);
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      if (mode === "RESCHEDULE") {
        if (!newDate || !newTime) {
          throw new Error("Please select new date and time");
        }

        const res = await fetch("/api/pt/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RESCHEDULE",
            sessionId: session.id,
            newDate,
            newTime,
            notes: rescheduleNotes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to reschedule session");
        }
      } else {
        const res = await fetch("/api/pt/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CANCEL",
            sessionId: session.id,
            restoreQuota,
            notes: cancelNotes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to cancel session");
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update session");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleOpen("RESCHEDULE")}
          className="h-8 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
          <span>Reschedule</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpen("CANCEL")}
          className="h-8 px-2 rounded border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 text-xs font-medium transition-colors"
          title="Cancel Session"
        >
          <Ban className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {mode === "RESCHEDULE" ? (
                  <RotateCcw className="w-4 h-4 text-[#1E40AF]" />
                ) : (
                  <Ban className="w-4 h-4 text-rose-600" />
                )}
                <h3 className="text-sm font-bold text-slate-900">
                  {mode === "RESCHEDULE" ? "Reschedule PT Session" : "Cancel PT Session"}
                </h3>
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

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-slate-900">{session.memberName}</p>
                <p className="text-slate-500">
                  Session #{session.sessionNumber} • Currently scheduled for {session.sessionDate} at {session.sessionTime.slice(0, 5)}
                </p>
              </div>

              {mode === "RESCHEDULE" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        New Date
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        New Time
                      </label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Reason / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={rescheduleNotes}
                      onChange={(e) => setRescheduleNotes(e.target.value)}
                      disabled={loading}
                      placeholder="e.g., Athlete requested moving session to evening slot"
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Cancellation Quota Choice */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Quota Treatment
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="quota"
                          checked={restoreQuota === true}
                          onChange={() => setRestoreQuota(true)}
                          className="text-[#1E40AF]"
                        />
                        <span className="text-slate-800 font-medium">Restore 1 Session Quota</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="quota"
                          checked={restoreQuota === false}
                          onChange={() => setRestoreQuota(false)}
                          className="text-rose-600"
                        />
                        <span className="text-slate-800 font-medium">Forfeit / Consume Quota</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {restoreQuota
                        ? "The member will not lose this session. Remaining quota will increase by 1."
                        : "Session is counted as forfeited (e.g., late cancellation within 2 hours). Quota is consumed."}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Cancellation Reason
                    </label>
                    <textarea
                      rows={2}
                      value={cancelNotes}
                      onChange={(e) => setCancelNotes(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {mode === "RESCHEDULE" ? "PT session rescheduled!" : "PT session cancelled!"}
                  </span>
                </div>
              )}

              {/* Actions */}
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
                  disabled={loading}
                  className={`h-8 px-4 rounded text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm ${
                    mode === "RESCHEDULE"
                      ? "bg-[#1E40AF] hover:bg-blue-800"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{mode === "RESCHEDULE" ? "Confirm Reschedule" : "Confirm Cancellation"}</span>
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
