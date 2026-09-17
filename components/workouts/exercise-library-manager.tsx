"use client";

import { useState, useMemo } from "react";
import {
  Dumbbell,
  Plus,
  Pencil,
  ExternalLink,
  Search,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { ExerciseModal } from "./exercise-modal";

interface Exercise {
  id: string;
  name: string;
  category: string;
  instructions: string | null;
  video_url: string | null;
  gym_id: string | null;
}

interface ExerciseLibraryManagerProps {
  initialExercises: Exercise[];
  userRole?: "OWNER" | "TRAINER" | "MEMBER";
  initialCategory?: string;
  initialQuery?: string;
}

const CATEGORIES = [
  "ALL",
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "CORE",
  "CARDIO",
];

export function ExerciseLibraryManager({
  initialExercises,
  userRole = "OWNER",
  initialCategory = "ALL",
  initialQuery = "",
}: ExerciseLibraryManagerProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddClick = () => {
    setExerciseToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (exercise: Exercise) => {
    setExerciseToEdit(exercise);
    setIsModalOpen(true);
  };

  const handleSaved = (savedExercise: any, isNew: boolean) => {
    if (isNew) {
      setExercises((prev) => [savedExercise, ...prev]);
      showToast(`Added "${savedExercise.name}" to exercise library!`);
    } else {
      setExercises((prev) =>
        prev.map((item) => (item.id === savedExercise.id ? savedExercise : item))
      );
      showToast(`Updated "${savedExercise.name}"!`);
    }
  };

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCategory =
        activeCategory === "ALL" ||
        ex.category.toUpperCase() === activeCategory.toUpperCase();
      const matchQuery =
        !searchQuery.trim() ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.instructions &&
          ex.instructions.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [exercises, activeCategory, searchQuery]);

  const canEdit = userRole === "OWNER" || userRole === "TRAINER";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Exercise Library & Templates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Central exercise encyclopedia used across the gym by personal trainers and floor staff.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleAddClick}
            className="h-9 px-4 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise Template</span>
          </button>
        )}
      </section>

      {/* Controls Bar: Category Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#1E40AF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises or cues..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {ex.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {ex.video_url && (
                      <a
                        href={ex.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-[#1E40AF] flex items-center gap-1 transition-colors"
                        title="Open exercise video demonstration"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Demo
                      </a>
                    )}

                    {canEdit && (
                      <button
                        onClick={() => handleEditClick(ex)}
                        className="text-xs text-slate-500 hover:text-[#1E40AF] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit exercise details"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{ex.name}</h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {ex.instructions || "Standard execution instructions."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
            <Dumbbell className="w-8 h-8 text-slate-300" />
            <span className="font-medium text-slate-600">No exercises found</span>
            <span className="text-xs text-slate-400">
              {searchQuery
                ? `No exercises match "${searchQuery}".`
                : "No movements logged under this category yet."}
            </span>
            {canEdit && (
              <button
                onClick={handleAddClick}
                className="mt-2 text-xs text-[#1E40AF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create first template</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog for Add / Edit */}
      <ExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        exerciseToEdit={exerciseToEdit}
      />
    </div>
  );
}
