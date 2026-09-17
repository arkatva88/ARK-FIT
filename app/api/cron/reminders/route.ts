import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotificationEvent } from "@/lib/notifications/outbox";
import { dispatchPendingEvents } from "@/lib/notifications/dispatcher";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // If no secret configured in dev, allow

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === cronSecret) return true;

  return false;
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 3 days from now
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  let enqueuedCount = 0;
  let skippedCount = 0;

  try {
    // 1. Scan for expiring memberships (expiring within next 3 days)
    const { data: expiringMembers } = await admin
      .from("members")
      .select(`
        id,
        gym_id,
        profile_id,
        membership_expiry,
        profiles (
          full_name
        )
      `)
      .eq("status", "ACTIVE")
      .gte("membership_expiry", todayStr)
      .lte("membership_expiry", in3Days);

    if (expiringMembers && expiringMembers.length > 0) {
      for (const m of expiringMembers) {
        const daysLeft = Math.ceil(
          (new Date(m.membership_expiry).getTime() - today.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        const deduplicationKey = `MEMBERSHIP_EXPIRING:${m.id}:${m.membership_expiry}`;
        const name = (m.profiles as any)?.full_name || "Member";

        const { isDuplicate } = await enqueueNotificationEvent({
          gymId: m.gym_id,
          userId: m.profile_id,
          type: "MEMBERSHIP_EXPIRING",
          title: "ARK FIT - Membership Expiring Soon",
          body: `Hi ${name}, your gym membership expires in ${daysLeft === 0 ? "today" : `${daysLeft} day(s)`}. Renew now to keep crushing your fitness goals!`,
          url: "/member/payments",
          referenceType: "member",
          referenceId: m.id,
          deduplicationKey,
          data: { expiryDate: m.membership_expiry, daysRemaining: daysLeft },
        });

        if (isDuplicate) skippedCount++;
        else enqueuedCount++;
      }
    }

    // 2. Scan for overdue payments (due_date < today and status IN ('PENDING', 'OVERDUE'))
    const { data: overduePayments } = await admin
      .from("payments")
      .select(`
        id,
        gym_id,
        amount,
        due_date,
        members (
          id,
          profile_id,
          profiles (
            full_name
          )
        )
      `)
      .in("status", ["PENDING", "OVERDUE"])
      .lt("due_date", todayStr);

    if (overduePayments && overduePayments.length > 0) {
      for (const p of overduePayments) {
        const member = p.members as any;
        if (!member?.profile_id) continue;

        const deduplicationKey = `PAYMENT_OVERDUE:${p.id}:${todayStr}`;
        const name = member.profiles?.full_name || "Member";

        const { isDuplicate } = await enqueueNotificationEvent({
          gymId: p.gym_id,
          userId: member.profile_id,
          type: "PAYMENT_REMINDER",
          title: "ARK FIT - Membership Payment Overdue",
          body: `Hello ${name}, an invoice of ₹${p.amount} is currently overdue. Please settle your gym dues to maintain active gym access.`,
          url: "/member/payments",
          referenceType: "payment",
          referenceId: p.id,
          deduplicationKey,
          data: { paymentId: p.id, amount: p.amount },
        });

        if (isDuplicate) skippedCount++;
        else enqueuedCount++;
      }
    }

    // 3. Process Outbox Dispatcher
    const dispatchResults = await dispatchPendingEvents(50);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      enqueued: enqueuedCount,
      skippedDuplicates: skippedCount,
      dispatched: dispatchResults.succeeded,
      processed: dispatchResults.processed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Cron execution error: " + err.message },
      { status: 500 }
    );
  }
}
