"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, X, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RescheduleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: {
    id: string;
    workout_date: string;
    title: string;
    member?: {
      profiles?: {
        full_name?: string;
      };
    };
  } | null;
  onSuccess?: () => void;
}

export function RescheduleWorkoutModal({
  isOpen,
  onClose,
  schedule,
  onSuccess,
}: RescheduleWorkoutModalProps) {
  const router = useRouter();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [newDate, setNewDate] = useState(tomorrow);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  if (!isOpen || !schedule) return null;

  const memberName = schedule.member?.profiles?.full_name || "Athlete";

  const handleQuickDate = (daysAhead: number) => {
    const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    setNewDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!newDate) {
      setError("Please select a target date");
      return;
    }

    if (newDate === schedule.workout_date) {
      setError("New date must be different from original workout date");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workouts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE",
          scheduleId: schedule.id,
          newDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule workout");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to reschedule workout");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#1E40AF]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Reschedule Workout</h2>
          </div>
          <p className="text-xs text-slate-500">
            Advance missed floor routine for <strong>{memberName}</strong> to an upcoming recovery or training day.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Workout successfully rescheduled to {formatDate(newDate)}!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Routine Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Original Scheduled Date:</span>
              <strong className="text-slate-900 font-mono">{formatDate(schedule.workout_date)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Target Split:</span>
              <strong className="text-[#1E40AF]">{schedule.title}</strong>
            </div>
          </div>

          {/* Quick Date Select Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(2)}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                In 2 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(3)}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                In 3 Days
              </button>
            </div>
          </div>

          {/* Target Reschedule Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Training Date *
            </label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Reason / Coach Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Coach Note / Reason (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Swapped with rest day due to absence"
              className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              disabled={loading || success}
              onClick={onClose}
              className="w-full sm:w-auto h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full sm:w-auto h-9 px-4 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <span>Confirm Reschedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
