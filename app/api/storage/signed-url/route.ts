import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path, expiresIn = 300 } = await req.json(); // Default 5 minutes

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Generate signed URL from private progress-photos bucket
    const { data, error } = await supabase.storage
      .from("progress-photos")
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
