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

    const admin = createAdminClient();

    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("role, gym_id")
      .eq("id", user.id)
      .single();

    if (ownerProfile?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only gym owners can update gym settings" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, address, currency = "INR", timezone = "Asia/Kolkata" } = body;

    const { data: updatedGym, error: updateErr } = await admin
      .from("gyms")
      .update({
        name: name?.trim() || "ARK FIT",
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        currency: currency?.toUpperCase() || "INR",
        timezone: timezone || "Asia/Kolkata",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownerProfile.gym_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Gym settings updated successfully",
      gym: updatedGym,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
