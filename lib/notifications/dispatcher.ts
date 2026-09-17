import { createAdminClient } from "@/lib/supabase/admin";
import { ensureVapidConfigured, webpush } from "./vapid";
import {
  NotificationEvent,
  NotificationType,
  PushPayload,
  PushSubscriptionRecord,
} from "./types";

/**
 * Checks whether the current time falls inside configured quiet hours for the given timezone.
 */
function isWithinQuietHours(
  now: Date,
  start: string,
  end: string,
  timezone: string
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentMinutes = hour * 60 + minute;

    const [startH, startM] = (start || "22:00").split(":").map(Number);
    const [endH, endM] = (end || "07:00").split(":").map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Over midnight (e.g. 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch (err) {
    console.warn("Error evaluating quiet hours:", err);
    return false;
  }
}

/**
 * Checks if a specific notification type is enabled in user preferences.
 */
function isCategoryEnabled(
  type: NotificationType,
  prefs: any
): boolean {
  if (!prefs) return true; // Default enabled

  switch (type) {
    case "PAYMENT_REMINDER":
      return prefs.payment_reminders ?? true;
    case "PAYMENT_RECEIVED":
    case "PAYMENT_FAILED":
      return prefs.payment_confirmations ?? true;
    case "MEMBERSHIP_EXPIRING":
    case "MEMBERSHIP_EXPIRED":
      return prefs.membership_expiry ?? true;
    case "PT_SESSION_REMINDER":
    case "PT_SESSION_CANCELLED":
      return prefs.pt_reminders ?? true;
    case "ATTENDANCE_REMINDER":
      return prefs.attendance_reminders ?? true;
    case "WORKOUT_REMINDER":
      return prefs.workout_reminders ?? true;
    case "ACCOUNT_SECURITY":
    case "SYSTEM_NOTIFICATION":
      return true; // Critical: cannot be muted
    default:
      return true;
  }
}

/**
 * Dispatches a single notification event.
 */
export async function dispatchSingleEvent(eventId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: event, error } = await admin
    .from("notification_events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    console.warn(`Event ${eventId} not found for dispatch:`, error?.message);
    return false;
  }

  // 1. Mark status PROCESSING
  await admin
    .from("notification_events")
    .update({ status: "PROCESSING", updated_at: new Date().toISOString() })
    .eq("id", event.id);

  // 2. Fetch User Notification Preferences
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", event.user_id)
    .maybeSingle();

  // Check category opt-in
  if (!isCategoryEnabled(event.type as NotificationType, prefs)) {
    await admin
      .from("notification_events")
      .update({
        status: "SKIPPED",
        last_error: "Muted by user notification preferences",
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return true;
  }

  // Check Quiet Hours (unless critical)
  if (
    prefs?.quiet_hours_enabled &&
    event.type !== "ACCOUNT_SECURITY" &&
    isWithinQuietHours(
      new Date(),
      prefs.quiet_hours_start,
      prefs.quiet_hours_end,
      prefs.timezone || "Asia/Kolkata"
    )
  ) {
    // Postpone delivery by 1 hour
    const nextWindow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await admin
      .from("notification_events")
      .update({
        status: "PENDING",
        scheduled_at: nextWindow,
        last_error: "Deferred due to quiet hours",
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return true;
  }

  // 3. Check VAPID Setup
  const vapidReady = ensureVapidConfigured();
  if (!vapidReady) {
    await admin
      .from("notification_events")
      .update({
        status: "SENT", // In-app notification was already saved in outbox enqueue
        last_error: "VAPID not configured; delivered to in-app inbox only",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return true;
  }

  // 4. Fetch Active Push Subscriptions for User
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", event.user_id)
    .is("revoked_at", null);

  if (!subscriptions || subscriptions.length === 0) {
    // User has no active push devices. In-app notification already recorded.
    await admin
      .from("notification_events")
      .update({
        status: "SENT",
        last_error: "No active push subscriptions; recorded in in-app inbox",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return true;
  }

  // 5. Multi-Device Web Push Dispatch
  const payload: PushPayload = {
    title: event.title,
    body: event.body,
    url: event.url,
    type: event.type as NotificationType,
    notificationId: event.id,
    tag: `arkfit-${event.type.toLowerCase()}-${event.reference_id || event.id}`,
    data: event.data || {},
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  let successfulSends = 0;
  let lastErrorMsg = "";

  for (const sub of subscriptions as PushSubscriptionRecord[]) {
    try {
      const pushSubscriptionObj = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      await webpush.sendNotification(pushSubscriptionObj, payloadString);

      // Record device send success
      await admin
        .from("push_subscriptions")
        .update({
          last_success_at: new Date().toISOString(),
          failure_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      successfulSends++;
    } catch (err: any) {
      const statusCode = err?.statusCode;
      lastErrorMsg = err?.message || "Push dispatch failed";

      // 410 Gone or 404 Not Found: subscription expired / revoked by user/browser
      if (statusCode === 410 || statusCode === 404) {
        await admin
          .from("push_subscriptions")
          .update({
            revoked_at: new Date().toISOString(),
            last_failure_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
      } else {
        // Transient error
        await admin
          .from("push_subscriptions")
          .update({
            last_failure_at: new Date().toISOString(),
            failure_count: (sub.failure_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
      }
    }
  }

  // 6. Finalize Event Record
  const newAttempts = (event.attempts || 0) + 1;

  if (successfulSends > 0) {
    await admin
      .from("notification_events")
      .update({
        status: "SENT",
        sent_at: new Date().toISOString(),
        attempts: newAttempts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return true;
  }

  // If push delivery failed across all devices
  if (newAttempts >= (event.max_attempts || 3)) {
    await admin
      .from("notification_events")
      .update({
        status: "FAILED",
        attempts: newAttempts,
        last_error: lastErrorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return false;
  } else {
    // Schedule retry with exponential backoff (1m, 2m, 4m)
    const backoffSeconds = Math.pow(2, newAttempts) * 60;
    const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString();

    await admin
      .from("notification_events")
      .update({
        status: "PENDING",
        attempts: newAttempts,
        scheduled_at: nextRetry,
        last_error: lastErrorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return false;
  }
}

/**
 * Scans and dispatches pending or ready-to-retry notification events from outbox.
 */
export async function dispatchPendingEvents(batchSize: number = 25): Promise<{
  processed: number;
  succeeded: number;
}> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Fetch pending events where scheduled_at <= NOW()
  const { data: events, error } = await admin
    .from("notification_events")
    .select("id")
    .in("status", ["PENDING"])
    .lte("scheduled_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error || !events || events.length === 0) {
    return { processed: 0, succeeded: 0 };
  }

  let succeeded = 0;
  for (const ev of events) {
    const ok = await dispatchSingleEvent(ev.id);
    if (ok) succeeded++;
  }

  return { processed: events.length, succeeded };
}
