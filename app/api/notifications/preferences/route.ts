import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    let { data: prefs } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prefs) {
      // Get user's gym_id
      const { data: profile } = await admin
        .from("profiles")
        .select("gym_id")
        .eq("id", user.id)
        .single();

      // Return default preferences
      prefs = {
        user_id: user.id,
        gym_id: profile?.gym_id,
        payment_reminders: true,
        payment_confirmations: true,
        membership_expiry: true,
        pt_reminders: true,
        attendance_reminders: true,
        workout_reminders: true,
        system_security: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Kolkata",
      };
    }

    return NextResponse.json({ preferences: prefs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) {
      return NextResponse.json({ error: "Gym profile not found" }, { status: 404 });
    }

    const safeFields: Record<string, any> = {
      user_id: user.id,
      gym_id: profile.gym_id,
      updated_at: new Date().toISOString(),
    };

    const allowedKeys = [
      "payment_reminders",
      "payment_confirmations",
      "membership_expiry",
      "pt_reminders",
      "attendance_reminders",
      "workout_reminders",
      "system_security",
      "quiet_hours_enabled",
      "quiet_hours_start",
      "quiet_hours_end",
      "timezone",
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        safeFields[key] = updates[key];
      }
    }

    const { data: updatedPrefs, error } = await admin
      .from("notification_preferences")
      .upsert(safeFields, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update preferences: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: updatedPrefs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
