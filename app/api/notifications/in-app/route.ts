import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    const admin = createAdminClient();

    // Fetch notifications for the user
    const { data: notifications, error } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count unread
    const { count: unreadCount, error: countErr } = await admin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
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

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;
    const admin = createAdminClient();

    if (markAllAsRead) {
      await admin
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);

      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      await admin
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide notificationId or markAllAsRead" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
