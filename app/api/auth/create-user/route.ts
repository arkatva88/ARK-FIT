import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is an OWNER
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, gym_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      email,
      temporaryPassword,
      fullName,
      phone,
      role, // 'TRAINER' | 'MEMBER'
      memberType, // 'NORMAL' | 'PT' (if role === 'MEMBER')
      assignedTrainerId,
      specialization, // (if role === 'TRAINER')
      bio,
    } = body;

    if (!email || !temporaryPassword || !fullName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (temporaryPassword.length < 6) {
      return NextResponse.json({ error: "Temporary password must be at least 6 characters" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with temporary password and pre-confirmed email
    const { data: createdAuth, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        must_change_password: true,
      },
    });

    if (authError || !createdAuth.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create auth user" }, { status: 400 });
    }

    const newUserId = createdAuth.user.id;

    // 2. Insert Profile record (force password change flag set to true)
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: newUserId,
      gym_id: callerProfile.gym_id,
      role,
      full_name: fullName,
      phone: phone || null,
      must_change_password: true,
    });

    if (profileError) {
      // Rollback auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: "Failed to create profile: " + profileError.message }, { status: 500 });
    }

    // 3. Insert role-specific record
    if (role === "TRAINER") {
      const { data: trainer, error: trainerError } = await adminClient
        .from("trainers")
        .insert({
          gym_id: callerProfile.gym_id,
          profile_id: newUserId,
          specialization: specialization || "General Fitness",
          bio: bio || null,
          is_active: true,
        })
        .select()
        .single();

      if (trainerError) {
        return NextResponse.json({ error: "Failed to create trainer record: " + trainerError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user_id: newUserId, trainer_id: trainer.id });
    }

    if (role === "MEMBER") {
      const { data: member, error: memberError } = await adminClient
        .from("members")
        .insert({
          gym_id: callerProfile.gym_id,
          profile_id: newUserId,
          member_type: memberType || "NORMAL",
          assigned_trainer_id: assignedTrainerId || null,
          status: "ACTIVE",
          membership_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select()
        .single();

      if (memberError) {
        return NextResponse.json({ error: "Failed to create member record: " + memberError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user_id: newUserId, member_id: member.id });
    }

    return NextResponse.json({ success: true, user_id: newUserId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
