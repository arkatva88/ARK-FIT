"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dumbbell,
  Salad,
  TrendingUp,
  FileText,
  X,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertTriangle
} from "lucide-react";

interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
}

interface RoutineDay {
  day: string;
  focus: string;
  exercises: ExerciseItem[];
}

interface MealItem {
  name: string;
  time: string;
  itemsText: string;
}

interface TrainerMemberActionsProps {
  memberId: string;
  workoutPlan: any;
  dietPlan: any;
}

export function TrainerMemberActions({ memberId, workoutPlan, dietPlan }: TrainerMemberActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeModal, setActiveModal] = useState<"WORKOUT" | "DIET" | "PROGRESS" | "NOTE" | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note state
  const [noteTitle, setNoteTitle] = useState("Form Observation");
  const [noteContent, setNoteContent] = useState("");

  // Progress state
  const [weightKg, setWeightKg] = useState("");
  const [chestInches, setChestInches] = useState("");
  const [waistInches, setWaistInches] = useState("");
  const [benchKg, setBenchKg] = useState("");
  const [squatKg, setSquatKg] = useState("");

  // Diet state
  const [dietGoal, setDietGoal] = useState<"MUSCLE_GAIN" | "FAT_LOSS" | "MAINTENANCE">(
    dietPlan?.goal || "MUSCLE_GAIN"
  );
  const [calories, setCalories] = useState(dietPlan?.calories?.toString() || "2400");
  const [proteinGrams, setProteinGrams] = useState(dietPlan?.protein_grams?.toString() || "140");
  const [meals, setMeals] = useState<MealItem[]>(
    dietPlan?.meals?.length > 0
      ? dietPlan.meals.map((m: any) => ({
          name: m.name || "Meal",
          time: m.time || "12:00 PM",
          itemsText: Array.isArray(m.items) ? m.items.join(", ") : (m.items || ""),
        }))
      : [
          { name: "Breakfast", time: "08:00 AM", itemsText: "4 Whole Eggs, 2 slices Brown Bread, 1 Banana" },
          { name: "Lunch", time: "01:30 PM", itemsText: "150g Grilled Chicken / Tofu, 1 cup Brown Rice, Green Salad" },
          { name: "Post-Workout Snack", time: "05:30 PM", itemsText: "1 Scoop Whey Protein with water, 15 Almonds" },
          { name: "Dinner", time: "08:30 PM", itemsText: "150g Paneer / Fish, Sauteed Veggies, 1 Multigrain Roti" },
        ]
  );

  // Workout state (pre-filled from existing plan or template)
  const [workoutTitle, setWorkoutTitle] = useState(workoutPlan?.title || "Custom Hypertrophy Split");
  const [workoutDays, setWorkoutDays] = useState<RoutineDay[]>(
    workoutPlan?.days?.length > 0
      ? workoutPlan.days.map((d: any) => ({
          day: d.day || "Day 1",
          focus: d.focus || "Chest & Triceps",
          exercises: Array.isArray(d.exercises) && d.exercises.length > 0
            ? d.exercises.map((ex: any) => ({
                name: ex.name || "Exercise",
                sets: Number(ex.sets) || 3,
                reps: ex.reps?.toString() || "10-12",
              }))
            : [{ name: "Barbell Bench Press", sets: 4, reps: "8-10" }],
        }))
      : [
          {
            day: "Monday",
            focus: "Chest + Triceps",
            exercises: [
              { name: "Barbell Bench Press", sets: 4, reps: "8-10" },
              { name: "Incline DB Press", sets: 3, reps: "10-12" },
              { name: "Cable Fly", sets: 3, reps: "15" },
              { name: "Tricep Pushdown", sets: 3, reps: "12" },
            ],
          },
          {
            day: "Wednesday",
            focus: "Back + Biceps",
            exercises: [
              { name: "Lat Pulldown", sets: 4, reps: "10-12" },
              { name: "Bent-Over Row", sets: 3, reps: "10" },
              { name: "Bicep Dumbbell Curl", sets: 3, reps: "12" },
            ],
          },
          {
            day: "Friday",
            focus: "Legs + Shoulders",
            exercises: [
              { name: "Barbell Squat", sets: 4, reps: "8-10" },
              { name: "Romanian Deadlift", sets: 3, reps: "10" },
              { name: "Overhead DB Shoulder Press", sets: 3, reps: "10" },
              { name: "Lateral Raises", sets: 4, reps: "15" },
            ],
          },
        ]
  );

  // --- WORKOUT BUILDER HELPERS ---
  const handleAddDay = () => {
    setWorkoutDays((prev) => [
      ...prev,
      {
        day: `Day ${prev.length + 1}`,
        focus: "Core & Conditioning",
        exercises: [{ name: "Plank Hold", sets: 3, reps: "60s" }],
      },
    ]);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (workoutDays.length <= 1) {
      alert("A workout routine must have at least one training day.");
      return;
    }
    setWorkoutDays((prev) => prev.filter((_, idx) => idx !== dayIndex));
  };

  const handleDayChange = (dayIndex: number, field: "day" | "focus", val: string) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      copy[dayIndex] = { ...copy[dayIndex], [field]: val };
      return copy;
    });
  };

  const handleAddExercise = (dayIndex: number) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      copy[dayIndex].exercises = [
        ...copy[dayIndex].exercises,
        { name: "", sets: 3, reps: "10" },
      ];
      return copy;
    });
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      copy[dayIndex].exercises = copy[dayIndex].exercises.filter((_, idx) => idx !== exIndex);
      return copy;
    });
  };

  const handleExerciseChange = (
    dayIndex: number,
    exIndex: number,
    field: "name" | "sets" | "reps",
    val: string | number
  ) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      const exList = [...copy[dayIndex].exercises];
      exList[exIndex] = { ...exList[exIndex], [field]: val };
      copy[dayIndex].exercises = exList;
      return copy;
    });
  };

  // --- DIET BUILDER HELPERS ---
  const handleAddMeal = () => {
    setMeals((prev) => [
      ...prev,
      { name: `Meal ${prev.length + 1}`, time: "04:00 PM", itemsText: "Fresh fruit & nuts" },
    ]);
  };

  const handleRemoveMeal = (mealIndex: number) => {
    if (meals.length <= 1) {
      alert("A diet plan must contain at least one meal.");
      return;
    }
    setMeals((prev) => prev.filter((_, idx) => idx !== mealIndex));
  };

  const handleMealChange = (mealIndex: number, field: "name" | "time" | "itemsText", val: string) => {
    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex] = { ...copy[mealIndex], [field]: val };
      return copy;
    });
  };

  // --- SAVE & DELETE HANDLERS ---
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user?.id).maybeSingle();

      // Clean days: remove blank exercises
      const cleanDays = workoutDays.map((d) => ({
        ...d,
        exercises: d.exercises.filter((ex) => ex.name.trim() !== ""),
      }));

      if (workoutPlan?.id) {
        // UPDATE existing workout plan
        const { error: err } = await supabase
          .from("workout_plans")
          .update({
            title: workoutTitle,
            days: cleanDays,
            status: "ACTIVE",
          })
          .eq("id", workoutPlan.id);
        if (err) throw err;
      } else {
        // Archive any previous plans for this member and insert new active plan
        await supabase
          .from("workout_plans")
          .update({ status: "ARCHIVED" })
          .eq("member_id", memberId);

        const { error: err } = await supabase.from("workout_plans").insert({
          gym_id: member.gym_id,
          member_id: memberId,
          trainer_id: trainer?.id || null,
          title: workoutTitle,
          days: cleanDays,
          status: "ACTIVE",
        });
        if (err) throw err;
      }

      setActiveModal(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!workoutPlan?.id) return;
    if (!confirm("Are you sure you want to delete this active workout routine? The member will no longer have an assigned workout.")) {
      return;
    }
    setDeleteLoading(true);
    try {
      const { error: err } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", workoutPlan.id);
      if (err) throw err;

      setActiveModal(null);
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete workout routine: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user?.id).maybeSingle();

      const formattedMeals = meals.map((m) => ({
        name: m.name.trim(),
        time: m.time.trim(),
        items: m.itemsText.split(",").map((s) => s.trim()).filter(Boolean),
      }));

      if (dietPlan?.id) {
        // UPDATE existing diet plan
        const { error: err } = await supabase
          .from("diet_plans")
          .update({
            goal: dietGoal,
            calories: parseInt(calories, 10) || 2000,
            protein_grams: parseInt(proteinGrams, 10) || 120,
            meals: formattedMeals,
            status: "ACTIVE",
          })
          .eq("id", dietPlan.id);
        if (err) throw err;
      } else {
        // Archive any previous diets and insert new active plan
        await supabase
          .from("diet_plans")
          .update({ status: "ARCHIVED" })
          .eq("member_id", memberId);

        const { error: err } = await supabase.from("diet_plans").insert({
          gym_id: member.gym_id,
          member_id: memberId,
          trainer_id: trainer?.id || null,
          goal: dietGoal,
          calories: parseInt(calories, 10) || 2000,
          protein_grams: parseInt(proteinGrams, 10) || 120,
          meals: formattedMeals,
          status: "ACTIVE",
        });
        if (err) throw err;
      }

      setActiveModal(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiet = async () => {
    if (!dietPlan?.id) return;
    if (!confirm("Are you sure you want to delete this diet plan? The member will no longer have an assigned diet plan.")) {
      return;
    }
    setDeleteLoading(true);
    try {
      const { error: err } = await supabase
        .from("diet_plans")
        .delete()
        .eq("id", dietPlan.id);
      if (err) throw err;

      setActiveModal(null);
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete diet plan: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const { error: err } = await supabase.from("progress_records").insert({
        gym_id: member.gym_id,
        member_id: memberId,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        chest_inches: chestInches ? parseFloat(chestInches) : null,
        waist_inches: waistInches ? parseFloat(waistInches) : null,
        bench_press_kg: benchKg ? parseFloat(benchKg) : null,
        squat_kg: squatKg ? parseFloat(squatKg) : null,
      });
      if (err) throw err;

      setActiveModal(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user?.id).maybeSingle();

      const { error: err } = await supabase.from("member_notes").insert({
        gym_id: member.gym_id,
        member_id: memberId,
        trainer_id: trainer?.id || null,
        title: noteTitle,
        content: noteContent,
        status: "OPEN",
      });
      if (err) throw err;

      setActiveModal(null);
      setNoteContent("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setActiveModal("WORKOUT")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          {workoutPlan ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-[#1E40AF]" /> Edit Workout Routine
            </>
          ) : (
            <>
              <Dumbbell className="w-3.5 h-3.5 text-[#1E40AF]" /> Assign Workout Routine
            </>
          )}
        </button>

        <button
          onClick={() => setActiveModal("DIET")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          {dietPlan ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Edit Nutrition & Diet
            </>
          ) : (
            <>
              <Salad className="w-3.5 h-3.5 text-emerald-600" /> Assign Nutrition & Diet
            </>
          )}
        </button>

        <button
          onClick={() => setActiveModal("PROGRESS")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#1E40AF]" /> Log Body Stats
        </button>

        <button
          onClick={() => setActiveModal("NOTE")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" /> Add Floor Note
        </button>
      </div>

      {/* MODAL CONTAINER */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full ${
              activeModal === "WORKOUT" ? "max-w-2xl" : "max-w-lg"
            } rounded-xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto`}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ================= WORKOUT BUILDER MODAL ================= */}
            {activeModal === "WORKOUT" && (
              <form onSubmit={handleSaveWorkout} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-[#1E40AF]" />
                    {workoutPlan ? "Edit Workout Routine" : "Assign Workout Routine"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize training days, exercise movements, sets, and rep targets for this athlete.
                  </p>
                </div>

                {/* Routine Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Routine Title</label>
                  <input
                    type="text"
                    required
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    placeholder="e.g. 4-Day Strength & Hypertrophy Split"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
                  />
                </div>

                {/* Training Days Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Training Days & Exercises ({workoutDays.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddDay}
                      className="h-7 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-[#1E40AF] text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Day
                    </button>
                  </div>

                  {workoutDays.map((day, dIdx) => (
                    <div key={dIdx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                          <input
                            type="text"
                            required
                            value={day.day}
                            onChange={(e) => handleDayChange(dIdx, "day", e.target.value)}
                            placeholder="Day name (e.g. Monday or Day 1)"
                            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                          />
                          <input
                            type="text"
                            required
                            value={day.focus}
                            onChange={(e) => handleDayChange(dIdx, "focus", e.target.value)}
                            placeholder="Focus (e.g. Chest + Triceps)"
                            className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDay(dIdx)}
                          title="Remove Day"
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Exercises Table for this Day */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                          <span className="col-span-6">Exercise Movement</span>
                          <span className="col-span-3">Sets</span>
                          <span className="col-span-2">Reps</span>
                          <span className="col-span-1"></span>
                        </div>

                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              required
                              value={ex.name}
                              onChange={(e) => handleExerciseChange(dIdx, exIdx, "name", e.target.value)}
                              placeholder="e.g. Incline Bench Press"
                              className="col-span-6 h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                            />
                            <input
                              type="number"
                              min={1}
                              max={20}
                              required
                              value={ex.sets}
                              onChange={(e) => handleExerciseChange(dIdx, exIdx, "sets", parseInt(e.target.value, 10) || 1)}
                              className="col-span-3 h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF] text-center"
                            />
                            <input
                              type="text"
                              required
                              value={ex.reps}
                              onChange={(e) => handleExerciseChange(dIdx, exIdx, "reps", e.target.value)}
                              placeholder="e.g. 8-12"
                              className="col-span-2 h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF] text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(dIdx, exIdx)}
                              className="col-span-1 p-1 text-slate-400 hover:text-rose-600 transition-colors flex justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddExercise(dIdx)}
                          className="mt-1 text-xs font-semibold text-[#1E40AF] hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Exercise
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit & Delete Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {workoutPlan?.id ? (
                    <button
                      type="button"
                      disabled={deleteLoading || loading}
                      onClick={handleDeleteWorkout}
                      className="h-9 px-3 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete Routine</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || deleteLoading}
                      className="h-9 px-5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{workoutPlan?.id ? "Update Routine" : "Assign Routine"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ================= DIET BUILDER MODAL ================= */}
            {activeModal === "DIET" && (
              <form onSubmit={handleSaveDiet} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Salad className="w-4 h-4 text-emerald-600" />
                    {dietPlan ? "Edit Nutrition & Diet Plan" : "Assign Nutrition & Diet Plan"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure target macros, calorie intake, and meal breakdowns for this athlete.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Goal</label>
                    <select
                      value={dietGoal}
                      onChange={(e: any) => setDietGoal(e.target.value)}
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    >
                      <option value="MUSCLE_GAIN">Muscle Gain</option>
                      <option value="FAT_LOSS">Fat Loss / Shred</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={6000}
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Protein (g)</label>
                    <input
                      type="number"
                      required
                      min={30}
                      max={400}
                      value={proteinGrams}
                      onChange={(e) => setProteinGrams(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>
                </div>

                {/* Meals Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Daily Meals Schedule ({meals.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddMeal}
                      className="h-7 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Meal
                    </button>
                  </div>

                  {meals.map((meal, mIdx) => (
                    <div key={mIdx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <input
                            type="text"
                            required
                            value={meal.name}
                            onChange={(e) => handleMealChange(mIdx, "name", e.target.value)}
                            placeholder="Meal name (e.g. Breakfast)"
                            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                          />
                          <input
                            type="text"
                            required
                            value={meal.time}
                            onChange={(e) => handleMealChange(mIdx, "time", e.target.value)}
                            placeholder="Time (e.g. 08:30 AM)"
                            className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMeal(mIdx)}
                          title="Remove Meal"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          value={meal.itemsText}
                          onChange={(e) => handleMealChange(mIdx, "itemsText", e.target.value)}
                          placeholder="Food items (comma separated, e.g. 4 Whole Eggs, 2 Toast, 1 Banana)"
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit & Delete Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {dietPlan?.id ? (
                    <button
                      type="button"
                      disabled={deleteLoading || loading}
                      onClick={handleDeleteDiet}
                      className="h-9 px-3 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete Diet</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || deleteLoading}
                      className="h-9 px-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{dietPlan?.id ? "Update Diet Plan" : "Assign Diet Plan"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ================= PROGRESS MODAL ================= */}
            {activeModal === "PROGRESS" && (
              <form onSubmit={handleSaveProgress} className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#1E40AF]" /> Log Body & Strength Stats
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record current scale weight, circumference tape measurements, and core lift PRs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="e.g. 74.5"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Waist (inches)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={waistInches}
                      onChange={(e) => setWaistInches(e.target.value)}
                      placeholder="e.g. 32.5"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Chest (inches)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={chestInches}
                      onChange={(e) => setChestInches(e.target.value)}
                      placeholder="e.g. 40.0"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bench Press (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={benchKg}
                      onChange={(e) => setBenchKg(e.target.value)}
                      placeholder="e.g. 85"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Squat (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={squatKg}
                      onChange={(e) => setSquatKg(e.target.value)}
                      placeholder="e.g. 110"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-9 px-5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Record Stats</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= NOTE MODAL ================= */}
            {activeModal === "NOTE" && (
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" /> Log Floor Observation / Form Note
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record joint discomfort, mobility restrictions, or form cues observed during floor training.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Note Category / Title</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Lower Back Fatigue on Deadlifts"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Details & Coaching Cues</label>
                  <textarea
                    required
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Describe observations, weights used, knee cave, or recovery recommendations..."
                    className="w-full p-3 text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-9 px-5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
