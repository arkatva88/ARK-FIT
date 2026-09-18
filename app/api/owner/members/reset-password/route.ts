import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Authorize that caller is strictly an OWNER
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role, gym_id, full_name")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Only authorized Gym Owners can initiate emergency password resets." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // 2. Multi-tenant isolation: verify target member exists and belongs to caller's gym
    const { data: member } = await admin
      .from("members")
      .select("id, gym_id, profile_id, profiles(full_name)")
      .eq("id", memberId)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.gym_id !== callerProfile.gym_id) {
      return NextResponse.json(
        { error: "Forbidden. Cannot reset credentials for an athlete belonging to another gym facility." },
        { status: 403 }
      );
    }

    // 3. Rate limiting: max 3 resets per member per 24 hours to prevent abuse
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentResetCount } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "MEMBER_PASSWORD_RESET_INITIATED")
      .eq("target_id", memberId)
      .gte("created_at", twentyFourHoursAgo);

    if (recentResetCount && recentResetCount >= 3) {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "Maximum password reset requests reached for this member (limit 3 per 24 hours). Please try again tomorrow.",
        },
        { status: 429 }
      );
    }

    // 4. Retrieve athlete auth record
    const { data: authUser, error: authUserErr } = await admin.auth.admin.getUserById(member.profile_id);
    if (authUserErr || !authUser?.user?.email) {
      return NextResponse.json(
        { error: "Failed to locate athlete authentication record: " + (authUserErr?.message || "No email") },
        { status: 404 }
      );
    }

    // 5. Generate secure one-time temporary password (at least 10 chars with special, upper, number)
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const temporaryPassword = `ArkFit!${randomHex}9`;

    // 6. Update user in Supabase Auth with temp password and set must_change_password: true
    const { error: updateAuthErr } = await admin.auth.admin.updateUserById(member.profile_id, {
      password: temporaryPassword,
      user_metadata: {
        ...authUser.user.user_metadata,
        must_change_password: true,
      },
    });

    if (updateAuthErr) {
      return NextResponse.json(
        { error: "Failed to set emergency password: " + updateAuthErr.message },
        { status: 500 }
      );
    }

    // 7. Update profile record must_change_password
    await admin
      .from("profiles")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("id", member.profile_id);

    // 8. Generate Supabase Auth direct recovery link
    const origin = req.headers.get("origin") || req.headers.get("host") || "https://arkfit.com";
    const protocol = origin.startsWith("http") ? "" : "https://";
    const baseUrl = `${protocol}${origin}`;

    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: authUser.user.email,
      options: {
        redirectTo: `${baseUrl}/change-password`,
      },
    });

    // 9. Record security audit log (Zero credentials/passwords logged!)
    await admin.from("audit_logs").insert({
      gym_id: callerProfile.gym_id,
      actor_id: user.id,
      event_type: "MEMBER_PASSWORD_RESET_INITIATED",
      target_type: "member",
      target_id: memberId,
      metadata: {
        actor_name: callerProfile.full_name,
        target_member_id: memberId,
        target_email: authUser.user.email,
        result: "SUCCESS",
        timestamp: new Date().toISOString(),
      },
    });

    const athleteName = (member.profiles as any)?.full_name || "Athlete";

    return NextResponse.json({
      success: true,
      message: `Emergency password reset initiated for ${athleteName}.`,
      temporaryPassword,
      recoveryLink: linkData?.properties?.action_link || null,
      athleteEmail: authUser.user.email,
      athleteName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
