"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, ExternalLink } from "lucide-react";

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
}

export function WorkoutChecklist({ routine }: RoutineProps) {
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setCompletedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const totalCount = routine.exercises?.length || 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="space-y-4">
      {/* Progress banner */}
      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">Session Progress</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block tabular-nums">
            {completedCount} of {totalCount} Exercises Completed
          </span>
        </div>
        {isAllCompleted && (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Workout Done!
          </span>
        )}
      </div>

      {/* Exercises checklist */}
      <div className="space-y-3">
        {routine.exercises?.map((ex, idx) => {
          const isDone = !!completedExercises[idx];

          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/60 opacity-80"
                  : "border-slate-200 bg-white hover:border-[#1E40AF] shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <button type="button" className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div>
                  <h3 className={`text-sm font-bold text-slate-900 ${isDone ? "line-through text-slate-400" : ""}`}>
                    {ex.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="font-mono text-[#1E40AF] font-bold">{ex.sets} Sets</span>
                    <span>•</span>
                    <span className="font-mono text-slate-700">{ex.reps} Reps</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" /> Rest: {ex.rest}
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
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
