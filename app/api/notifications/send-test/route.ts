import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchSingleEvent } from "@/lib/notifications/dispatcher";

export async function POST() {
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
      .select("gym_id, full_name, role")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if user has active push subscriptions
    const { data: subs, count } = await admin
      .from("push_subscriptions")
      .select("id, device_label, endpoint", { count: "exact" })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    const timestamp = new Date().toISOString();
    const deduplicationKey = `TEST_PUSH:${user.id}:${Date.now()}`;

    const { event, error: enqueueErr } = await enqueueNotificationEvent({
      gymId: profile.gym_id,
      userId: user.id,
      type: "SYSTEM_NOTIFICATION",
      title: "ARK FIT Push Notifications Active!",
      body: `Hello ${profile.full_name}, Web Push is successfully connected for your device.`,
      url: profile.role === "OWNER" ? "/owner" : profile.role === "TRAINER" ? "/trainer" : "/member",
      deduplicationKey,
      data: { test: true, sentAt: timestamp },
    });

    if (enqueueErr || !event) {
      return NextResponse.json(
        { error: "Failed to queue test notification: " + enqueueErr },
        { status: 500 }
      );
    }

    // Dispatch immediately
    const dispatched = await dispatchSingleEvent(event.id);

    return NextResponse.json({
      success: true,
      activeSubscriptions: count || 0,
      dispatched,
      message:
        (count || 0) > 0
          ? `Push notification dispatched to ${count} registered device(s).`
          : "Notification recorded in in-app inbox (No browser push subscription registered yet).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
