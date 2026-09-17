import { createClient } from "@/lib/supabase/server";
import { ExerciseLibraryManager } from "@/components/workouts/exercise-library-manager";

interface PageProps {
  searchParams: { category?: string; q?: string };
}

export default async function TrainerWorkoutsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const category = searchParams.category || "ALL";
  const query = searchParams.q || "";

  let dbQuery = supabase.from("exercise_library").select("*").order("name", { ascending: true });

  if (category !== "ALL") {
    dbQuery = dbQuery.eq("category", category);
  }

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const { data: exercises } = await dbQuery;

  return (
    <ExerciseLibraryManager
      initialExercises={exercises || []}
      userRole="TRAINER"
      initialCategory={category}
      initialQuery={query}
    />
  );
}

