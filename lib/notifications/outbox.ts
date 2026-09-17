import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationType, NotificationEvent } from "./types";

export interface EnqueueNotificationParams {
  gymId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
  deduplicationKey: string;
  scheduledAt?: string | Date;
}

export interface EnqueueResult {
  event: NotificationEvent | null;
  isDuplicate: boolean;
  error?: string;
}

/**
 * Enqueues a notification event into the transactional outbox.
 * Idempotent: Enforces deduplication_key uniqueness to prevent duplicate alerts.
 */
export async function enqueueNotificationEvent(
  params: EnqueueNotificationParams
): Promise<EnqueueResult> {
  const admin = createAdminClient();

  const scheduledAt = params.scheduledAt
    ? typeof params.scheduledAt === "string"
      ? params.scheduledAt
      : params.scheduledAt.toISOString()
    : new Date().toISOString();

  const eventPayload = {
    gym_id: params.gymId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    url: params.url || "/member",
    data: params.data || {},
    reference_type: params.referenceType || null,
    reference_id: params.referenceId || null,
    deduplication_key: params.deduplicationKey,
    status: "PENDING",
    attempts: 0,
    max_attempts: 3,
    scheduled_at: scheduledAt,
  };

  // 1. Check if event with deduplication_key already exists
  const { data: existing } = await admin
    .from("notification_events")
    .select("*")
    .eq("deduplication_key", params.deduplicationKey)
    .maybeSingle();

  if (existing) {
    return {
      event: existing as NotificationEvent,
      isDuplicate: true,
    };
  }

  // 2. Insert new outbox event
  const { data: newEvent, error: insertError } = await admin
    .from("notification_events")
    .insert(eventPayload)
    .select()
    .single();

  if (insertError) {
    // If unique constraint race condition hit
    if (insertError.code === "23505") {
      const { data: racedEvent } = await admin
        .from("notification_events")
        .select("*")
        .eq("deduplication_key", params.deduplicationKey)
        .single();
      return {
        event: racedEvent as NotificationEvent,
        isDuplicate: true,
      };
    }
    return {
      event: null,
      isDuplicate: false,
      error: insertError.message,
    };
  }

  // 3. Immediately store in in-app notification history as reliable fallback
  await admin.from("notifications").insert({
    gym_id: params.gymId,
    user_id: params.userId,
    event_id: newEvent.id,
    type: params.type,
    title: params.title,
    body: params.body,
    url: params.url || "/member",
    read_at: null,
  });

  return {
    event: newEvent as NotificationEvent,
    isDuplicate: false,
  };
}
