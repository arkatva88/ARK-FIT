"use client";

import { useState } from "react";
import { AlertCircle, Calendar, ArrowRight, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RescheduleWorkoutModal } from "@/components/workouts/reschedule-workout-modal";

interface MissedWorkoutItem {
  id: string;
  workout_date: string;
  title: string;
  day_name?: string;
  member?: any;
}

interface MissedWorkoutsListProps {
  workouts: MissedWorkoutItem[];
}

export function MissedWorkoutsList({ workouts }: MissedWorkoutsListProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<{
    id: string;
    workout_date: string;
    title: string;
    member?: {
      profiles?: {
        full_name?: string;
      };
    };
  } | null>(null);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Missed Workouts Needing Action
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-mono">
          {workouts.length} Pending
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {workouts.length > 0 ? (
          workouts.map((w) => {
            const mem = Array.isArray(w.member) ? w.member[0] : w.member;
            const profile = Array.isArray(mem?.profiles) ? mem?.profiles[0] : mem?.profiles;
            const memberName = profile?.full_name || "Athlete";

            return (
              <div
                key={w.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{memberName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono font-semibold">
                      Missed: {formatDate(w.workout_date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Scheduled Routine: <strong className="text-slate-800">{w.title}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedWorkout({
                        id: w.id,
                        workout_date: w.workout_date,
                        title: w.title,
                        member: { profiles: { full_name: memberName } },
                      })
                    }
                    className="h-8 px-3 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No missed workouts requiring action. Floor schedule is on track!
          </div>
        )}
      </div>

      {selectedWorkout && (
        <RescheduleWorkoutModal
          isOpen={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          schedule={selectedWorkout}
          onSuccess={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
}
