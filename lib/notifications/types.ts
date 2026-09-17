export type NotificationType =
  | "PAYMENT_REMINDER"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "MEMBERSHIP_EXPIRING"
  | "MEMBERSHIP_EXPIRED"
  | "PT_SESSION_REMINDER"
  | "PT_SESSION_CANCELLED"
  | "ATTENDANCE_REMINDER"
  | "WORKOUT_REMINDER"
  | "ACCOUNT_SECURITY"
  | "SYSTEM_NOTIFICATION";

export type NotificationEventStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "SKIPPED";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  notificationId?: string;
  type?: NotificationType;
  data?: Record<string, any>;
  timestamp?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  gym_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string | null;
  device_label?: string | null;
  created_at: string;
  updated_at: string;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  failure_count: number;
  revoked_at?: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  gym_id: string;
  payment_reminders: boolean;
  payment_confirmations: boolean;
  membership_expiry: boolean;
  pt_reminders: boolean;
  attendance_reminders: boolean;
  workout_reminders: boolean;
  system_security: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // '22:00'
  quiet_hours_end: string;   // '07:00'
  timezone: string;          // 'Asia/Kolkata'
  created_at: string;
  updated_at: string;
}

export interface NotificationEvent {
  id: string;
  gym_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  data: Record<string, any>;
  reference_type?: string | null;
  reference_id?: string | null;
  deduplication_key: string;
  status: NotificationEventStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string | null;
  scheduled_at: string;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  gym_id: string;
  user_id: string;
  event_id?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  read_at?: string | null;
  created_at: string;
}
