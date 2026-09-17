import { createClient } from "@/lib/supabase/server";
import { ExerciseLibraryManager } from "@/components/workouts/exercise-library-manager";

interface PageProps {
  searchParams: { category?: string; q?: string };
}

export default async function OwnerWorkoutsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeCategory = searchParams.category || "ALL";
  const query = searchParams.q || "";

  let exQuery = supabase.from("exercise_library").select("*").order("name", { ascending: true });

  if (activeCategory !== "ALL") {
    exQuery = exQuery.eq("category", activeCategory);
  }

  if (query) {
    exQuery = exQuery.ilike("name", `%${query}%`);
  }

  const { data: exercises } = await exQuery;

  return (
    <ExerciseLibraryManager
      initialExercises={exercises || []}
      userRole="OWNER"
      initialCategory={activeCategory}
      initialQuery={query}
    />
  );
}

