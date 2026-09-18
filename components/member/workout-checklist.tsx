"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, ExternalLink, Loader2, Sparkles } from "lucide-react";

interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  video_url?: string;
}

interface RoutineProps {
  routine: {
    day: string;
    focus: string;
    exercises: ExerciseItem[];
  };
  scheduleId?: string;
  initialCompletedIndices?: number[];
  isCompleted?: boolean;
}

export function WorkoutChecklist({
  routine,
  scheduleId,
  initialCompletedIndices = [],
  isCompleted = false,
}: RoutineProps) {
  const router = useRouter();

  // Initialize completed map from initialCompletedIndices
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    if (isCompleted) {
      routine.exercises?.forEach((_, i) => {
        map[i] = true;
      });
    } else {
      initialCompletedIndices.forEach((idx) => {
        map[idx] = true;
      });
    }
    return map;
  });

  const [workoutDone, setWorkoutDone] = useState(isCompleted);
  const [syncing, setSyncing] = useState(false);
  const [logging, setLogging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const syncExerciseProgress = (newIndices: number[]) => {
    if (!scheduleId) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSyncing(true);
        await fetch("/api/workouts/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "TOGGLE_EXERCISE",
            scheduleId,
            completedIndices: newIndices,
          }),
        });
      } catch (e) {
        console.error("Failed to sync exercise progress:", e);
      } finally {
        setSyncing(false);
      }
    }, 400);
  };

  const toggle = (idx: number) => {
    if (workoutDone) return; // locked once logged

    const nextState = !completedExercises[idx];
    const updated = { ...completedExercises, [idx]: nextState };
    setCompletedExercises(updated);

    const activeIndices = Object.entries(updated)
      .filter(([_, done]) => done)
      .map(([i]) => Number(i));

    syncExerciseProgress(activeIndices);
  };

  const handleFinishWorkout = async () => {
    if (!scheduleId || logging || workoutDone) return;

    setLogging(true);
    try {
      const activeIndices = Object.entries(completedExercises)
        .filter(([_, done]) => done)
        .map(([i]) => Number(i));

      const res = await fetch("/api/workouts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_WORKOUT",
          scheduleId,
          completedIndices: activeIndices.length > 0 ? activeIndices : routine.exercises?.map((_, i) => i),
        }),
      });

      if (res.ok) {
        setWorkoutDone(true);
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to record workout completion:", e);
    } finally {
      setLogging(false);
    }
  };

  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const totalCount = routine.exercises?.length || 0;
  const isAllSelected = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="space-y-4">
      {/* Progress banner */}
      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Session Progress
            </span>
            {syncing && <span className="text-[10px] text-blue-600 animate-pulse">Saving...</span>}
          </div>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block tabular-nums">
            {completedCount} of {totalCount} Exercises Completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {workoutDone ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Workout Completed!
            </span>
          ) : (
            scheduleId && (
              <button
                type="button"
                onClick={handleFinishWorkout}
                disabled={logging}
                className="h-8 px-3.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {logging ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Logging...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAllSelected ? "Finish & Log Workout" : "Log Session"}</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Exercises checklist */}
      <div className="space-y-3">
        {routine.exercises?.map((ex, idx) => {
          const isDone = !!completedExercises[idx];

          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              className={`p-4 rounded-lg border transition-all ${
                workoutDone ? "cursor-default" : "cursor-pointer"
              } flex items-start justify-between gap-3 ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/60 opacity-80"
                  : "border-slate-200 bg-white hover:border-[#1E40AF] shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <button type="button" className="mt-0.5 shrink-0" disabled={workoutDone}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div>
                  <h3
                    className={`text-sm font-bold text-slate-900 ${
                      isDone ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {ex.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="font-mono text-[#1E40AF] font-bold">{ex.sets} Sets</span>
                    <span>•</span>
                    <span className="font-mono text-slate-700">{ex.reps} Reps</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Rest: {ex.rest}
                    </span>
                  </div>

                  {ex.notes && (
                    <p className="text-xs text-slate-600 italic mt-2">
                      Tip: {ex.notes}
                    </p>
                  )}
                </div>
              </div>

              {ex.video_url && (
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                  title="Watch Demonstration"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
