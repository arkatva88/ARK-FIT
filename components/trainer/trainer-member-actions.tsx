"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Salad, TrendingUp, FileText, X, Loader2 } from "lucide-react";

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
  const [calories, setCalories] = useState(dietPlan?.calories?.toString() || "2400");
  const [proteinGrams, setProteinGrams] = useState(dietPlan?.protein_grams?.toString() || "140");
  const [breakfast, setBreakfast] = useState(dietPlan?.meals?.[0]?.items?.join(", ") || "4 Whole Eggs, 2 slices Whole Wheat Toast, 1 Banana");
  const [lunch, setLunch] = useState(dietPlan?.meals?.[1]?.items?.join(", ") || "150g Grilled Chicken Breast, 1 cup Brown Rice, Green Salad");
  const [snack, setSnack] = useState(dietPlan?.meals?.[2]?.items?.join(", ") || "1 Scoop Whey Protein with water, 15 Almonds");
  const [dinner, setDinner] = useState(dietPlan?.meals?.[3]?.items?.join(", ") || "150g Paneer / Fish, Sauteed Vegetables, 1 Roti");

  // Workout state
  const [workoutTitle, setWorkoutTitle] = useState(workoutPlan?.title || "Hypertrophy Push-Pull-Legs");

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const { error: err } = await supabase.from("member_notes").insert({
        gym_id: member.gym_id,
        member_id: memberId,
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

  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const mealsData = [
        { name: "Breakfast", time: "08:00 AM", items: breakfast.split(",").map((s: string) => s.trim()) },
        { name: "Lunch", time: "01:30 PM", items: lunch.split(",").map((s: string) => s.trim()) },
        { name: "Post-Workout Snack", time: "05:30 PM", items: snack.split(",").map((s: string) => s.trim()) },
        { name: "Dinner", time: "08:30 PM", items: dinner.split(",").map((s: string) => s.trim()) },
      ];

      const { error: err } = await supabase.from("diet_plans").insert({
        gym_id: member.gym_id,
        member_id: memberId,
        goal: "MUSCLE_GAIN",
        calories: parseInt(calories, 10),
        protein_grams: parseInt(proteinGrams, 10),
        meals: mealsData,
        status: "ACTIVE",
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

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: member } = await supabase.from("members").select("gym_id").eq("id", memberId).single();
      if (!member) throw new Error("Member not found");

      const sampleDays = [
        {
          day: "Monday",
          focus: "Chest + Triceps",
          exercises: [
            { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "90s" },
            { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "60s" },
            { name: "Cable Chest Fly", sets: 3, reps: "15", rest: "60s" },
            { name: "Tricep Rope Pushdown", sets: 3, reps: "12", rest: "60s" },
          ],
        },
        {
          day: "Wednesday",
          focus: "Back + Biceps",
          exercises: [
            { name: "Lat Pulldown", sets: 4, reps: "10", rest: "90s" },
            { name: "Barbell Bent-Over Row", sets: 3, reps: "10", rest: "90s" },
            { name: "Barbell Bicep Curl", sets: 3, reps: "12", rest: "60s" },
          ],
        },
        {
          day: "Friday",
          focus: "Legs + Shoulders",
          exercises: [
            { name: "Barbell Back Squat", sets: 4, reps: "8", rest: "120s" },
            { name: "Romanian Deadlift", sets: 3, reps: "10", rest: "90s" },
            { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "10", rest: "60s" },
            { name: "Lateral Raises", sets: 4, reps: "15", rest: "45s" },
          ],
        },
      ];

      const { error: err } = await supabase.from("workout_plans").insert({
        gym_id: member.gym_id,
        member_id: memberId,
        title: workoutTitle,
        days: sampleDays,
        status: "ACTIVE",
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

  return (
    <>
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setActiveModal("WORKOUT")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Dumbbell className="w-3.5 h-3.5 text-[#1E40AF]" /> Assign Workout
        </button>

        <button
          onClick={() => setActiveModal("DIET")}
          className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Salad className="w-3.5 h-3.5 text-emerald-600" /> Assign Diet
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Note Modal */}
            {activeModal === "NOTE" && (
              <form onSubmit={handleSaveNote} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Log Floor Observation / Injury
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Observation</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Mild shoulder discomfort during overhead pressing. Suggested dumbbell neutral grip."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Note"}
                </button>
              </form>
            )}

            {/* Progress Modal */}
            {activeModal === "PROGRESS" && (
              <form onSubmit={handleSaveProgress} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1E40AF]" /> Log Body & Strength Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 76.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Chest (")</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 40"
                      value={chestInches}
                      onChange={(e) => setChestInches(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Waist (")</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 32"
                      value={waistInches}
                      onChange={(e) => setWaistInches(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bench (kg)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="e.g. 80"
                      value={benchKg}
                      onChange={(e) => setBenchKg(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Squat (kg)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 100"
                    value={squatKg}
                    onChange={(e) => setSquatKg(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Body Stats"}
                </button>
              </form>
            )}

            {/* Diet Modal */}
            {activeModal === "DIET" && (
              <form onSubmit={handleSaveDiet} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Salad className="w-4 h-4 text-emerald-600" /> Assign Meal Plan
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Calories</label>
                    <input
                      type="number"
                      required
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Protein (g)</label>
                    <input
                      type="number"
                      required
                      value={proteinGrams}
                      onChange={(e) => setProteinGrams(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Breakfast</label>
                  <input
                    type="text"
                    required
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lunch</label>
                  <input
                    type="text"
                    required
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Post-Workout / Snack</label>
                  <input
                    type="text"
                    required
                    value={snack}
                    onChange={(e) => setSnack(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dinner</label>
                  <input
                    type="text"
                    required
                    value={dinner}
                    onChange={(e) => setDinner(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Diet Plan"}
                </button>
              </form>
            )}

            {/* Workout Modal */}
            {activeModal === "WORKOUT" && (
              <form onSubmit={handleSaveWorkout} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#1E40AF]" /> Assign Workout Routine
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Routine Title</label>
                  <input
                    type="text"
                    required
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Routine Split Preview:</p>
                  <p>• Day 1: Barbell Bench Press, Incline DB Press, Cable Fly, Triceps</p>
                  <p>• Day 2: Lat Pulldown, Bent-over Row, Bicep Curls</p>
                  <p>• Day 3: Barbell Squat, RDL, DB Shoulder Press, Lateral Raises</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Assign Routine"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
