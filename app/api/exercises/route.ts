import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "CORE",
  "CARDIO",
] as const;

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    let dbQuery = admin
      .from("exercise_library")
      .select("*")
      .or(`gym_id.is.null,gym_id.eq.${profile.gym_id}`)
      .order("name", { ascending: true });

    if (category && category !== "ALL") {
      dbQuery = dbQuery.eq("category", category);
    }

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`);
    }

    const { data: exercises, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exercises });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "OWNER" && profile.role !== "TRAINER")) {
      return NextResponse.json(
        { error: "Forbidden: only owners and trainers can create exercises" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, category, instructions, video_url } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Exercise name is required." },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: exercise, error } = await admin
      .from("exercise_library")
      .insert({
        gym_id: profile.gym_id,
        name: name.trim(),
        category,
        instructions: instructions?.trim() || null,
        video_url: video_url?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, exercise });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create exercise template" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "OWNER" && profile.role !== "TRAINER")) {
      return NextResponse.json(
        { error: "Forbidden: only owners and trainers can update exercises" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, category, instructions, video_url } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Exercise ID is required." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Exercise name is required." },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify existing exercise
    const { data: existing } = await admin
      .from("exercise_library")
      .select("id, gym_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found." },
        { status: 404 }
      );
    }

    const { data: updatedExercise, error: updateErr } = await admin
      .from("exercise_library")
      .update({
        name: name.trim(),
        category,
        instructions: instructions?.trim() || null,
        video_url: video_url?.trim() || null,
        gym_id: existing.gym_id || profile.gym_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, exercise: updatedExercise });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update exercise template" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "OWNER" && profile.role !== "TRAINER")) {
      return NextResponse.json(
        { error: "Forbidden: only owners and trainers can delete exercises" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Exercise ID is required." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("exercise_library")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Exercise removed." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete exercise" },
      { status: 500 }
    );
  }
}
