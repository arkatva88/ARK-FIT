import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/notifications/vapid";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "VAPID key not configured" },
      { status: 500 }
    );
  }
}
