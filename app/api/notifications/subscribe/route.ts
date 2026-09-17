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
    const { subscription, deviceLabel } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid PushSubscription payload: missing endpoint or keys." },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid PushSubscription keys: p256dh and auth are required." },
        { status: 400 }
      );
    }

    // Basic endpoint URL validation
    try {
      const url = new URL(endpoint);
      if (url.protocol !== "https:") {
        return NextResponse.json(
          { error: "Push endpoint must use HTTPS." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid push endpoint format." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch user's gym_id from profile
    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) {
      return NextResponse.json(
        { error: "User profile or gym affiliation not found." },
        { status: 404 }
      );
    }

    const userAgent = req.headers.get("user-agent") || null;

    // Upsert subscription: if endpoint exists, re-activate and associate with this user
    const { data: savedSub, error: upsertErr } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          gym_id: profile.gym_id,
          endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_agent: userAgent,
          device_label: deviceLabel || "Web Browser",
          revoked_at: null,
          failure_count: 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      )
      .select()
      .single();

    if (upsertErr) {
      return NextResponse.json(
        { error: "Failed to store subscription: " + upsertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: savedSub.id,
      deviceLabel: savedSub.device_label,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
