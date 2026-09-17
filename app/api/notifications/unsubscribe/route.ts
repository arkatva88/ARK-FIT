import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Mark subscription revoked for this user
    await admin
      .from("push_subscriptions")
      .update({
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
