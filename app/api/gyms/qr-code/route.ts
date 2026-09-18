import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify caller role (OWNER or TRAINER)
    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "OWNER" && profile.role !== "TRAINER")) {
      return NextResponse.json({ error: "Forbidden. Staff only." }, { status: 403 });
    }

    const { data: gym } = await admin
      .from("gyms")
      .select("id, name, slug, qr_code_token, phone, address")
      .eq("id", profile.gym_id)
      .single();

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Ensure qr_code_token exists
    let token = gym.qr_code_token;
    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
      await admin.from("gyms").update({ qr_code_token: token }).eq("id", gym.id);
    }

    // Construct full check-in URL
    const origin = req.headers.get("origin") || req.headers.get("host") || "https://arkfit.com";
    const protocol = origin.startsWith("http") ? "" : "https://";
    const baseUrl = `${protocol}${origin}`;
    const checkInUrl = `${baseUrl}/attendance/qr?code=${token}`;

    // Generate QR code Data URL
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      gymName: gym.name,
      qrCodeToken: token,
      checkInUrl,
      qrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify caller is specifically OWNER
    const { data: profile } = await admin
      .from("profiles")
      .select("role, gym_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden. Gym Owners only." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action !== "REGENERATE") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Generate new secure 32-char hex token
    const newToken = crypto.randomBytes(16).toString("hex");

    const { data: updatedGym, error: updateErr } = await admin
      .from("gyms")
      .update({
        qr_code_token: newToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.gym_id)
      .select("id, name, qr_code_token")
      .single();

    if (updateErr || !updatedGym) {
      return NextResponse.json({ error: updateErr?.message || "Failed to rotate QR token" }, { status: 500 });
    }

    // Record immutable audit log
    await admin.from("audit_logs").insert({
      gym_id: profile.gym_id,
      actor_id: user.id,
      event_type: "GYM_QR_REGENERATED",
      target_type: "gym",
      target_id: profile.gym_id,
      metadata: {
        actor_name: profile.full_name,
        timestamp: new Date().toISOString(),
      },
    });

    const origin = req.headers.get("origin") || req.headers.get("host") || "https://arkfit.com";
    const protocol = origin.startsWith("http") ? "" : "https://";
    const baseUrl = `${protocol}${origin}`;
    const checkInUrl = `${baseUrl}/attendance/qr?code=${newToken}`;

    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gym QR code regenerated successfully. The old QR code is now invalid.",
      gymName: updatedGym.name,
      qrCodeToken: newToken,
      checkInUrl,
      qrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
