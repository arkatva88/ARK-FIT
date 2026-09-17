"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Dumbbell, Video, AlignLeft, Tag, CheckCircle2 } from "lucide-react";

interface Exercise {
  id?: string;
  name: string;
  category: string;
  instructions?: string | null;
  video_url?: string | null;
  gym_id?: string | null;
}

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (exercise: Exercise, isNew: boolean) => void;
  exerciseToEdit?: Exercise | null;
}

const CATEGORIES = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "CORE",
  "CARDIO",
];

export function ExerciseModal({
  isOpen,
  onClose,
  onSaved,
  exerciseToEdit,
}: ExerciseModalProps) {
  const isEditing = !!exerciseToEdit?.id;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CHEST");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name || "");
      setCategory(exerciseToEdit.category || "CHEST");
      setInstructions(exerciseToEdit.instructions || "");
      setVideoUrl(exerciseToEdit.video_url || "");
    } else {
      setName("");
      setCategory("CHEST");
      setInstructions("");
      setVideoUrl("");
    }
    setErrorMessage(null);
  }, [exerciseToEdit, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please provide an exercise name.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        id: exerciseToEdit?.id,
        name: name.trim(),
        category,
        instructions: instructions.trim() || null,
        video_url: videoUrl.trim() || null,
      };

      const res = await fetch("/api/exercises", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save exercise template");
      }

      onSaved(data.exercise, !isEditing);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 flex items-center justify-center shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Exercise Template" : "Add Exercise Template"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? "Update exercise movement details, category or form instructions."
                  : "Add a movement to the central encyclopedia for trainers and members."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Exercise Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exercise Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incline Dumbbell Press, Romanian Deadlift"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Muscle Category</span> <span className="text-rose-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Form Instructions / Form Cues */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Form Instructions & Coaching Cues</span>
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Lie back on bench at 30-degree incline. Lower dumbbells smoothly with controlled tempo, drive up squeezing upper chest."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors resize-none"
            />
          </div>

          {/* Video Demonstration URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-slate-500" />
              <span>Video Demo URL (Optional)</span>
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              External link to YouTube, Vimeo, or video demo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Create Template"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
