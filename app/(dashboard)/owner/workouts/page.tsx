import { createClient } from "@/lib/supabase/server";
import { Dumbbell, ExternalLink } from "lucide-react";
import Link from "next/link";

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

  const categories = [
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

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Exercise Library & Templates
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Central exercise encyclopedia used across the gym by personal trainers and floor staff.
        </p>
      </section>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/owner/workouts?category=${cat}`}
            className={`h-8 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap flex items-center ${
              activeCategory === cat
                ? "bg-[#1E40AF] text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises && exercises.length > 0 ? (
          exercises.map((ex: any) => (
            <div key={ex.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {ex.category}
                  </span>
                  {ex.video_url && (
                    <a
                      href={ex.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-[#1E40AF] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Demo
                    </a>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ex.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {ex.instructions || "Standard execution instructions."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            No exercises found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
