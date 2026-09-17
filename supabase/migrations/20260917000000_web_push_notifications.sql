-- ==============================================================================
-- ARK FIT - Web Push Notification System Migration
-- Tables: push_subscriptions, notification_preferences, notification_events, notifications
-- ==============================================================================

-- 1. Push Subscriptions (Multi-device capability records)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    device_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INT NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ
);

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    payment_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    payment_confirmations BOOLEAN NOT NULL DEFAULT TRUE,
    membership_expiry BOOLEAN NOT NULL DEFAULT TRUE,
    pt_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    attendance_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    workout_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    system_security BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TIME NOT NULL DEFAULT '22:00',
    quiet_hours_end TIME NOT NULL DEFAULT '07:00',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Notification Outbox Events (Deduplication & Transactional Reliability)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '/member',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    reference_type TEXT,
    reference_id TEXT,
    deduplication_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. In-App Notification History (Permanent Fallback Record)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES notification_events(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '/member',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_push_subs_user_active ON push_subscriptions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_gym ON push_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_pref_gym ON notification_preferences(gym_id);

CREATE INDEX IF NOT EXISTS idx_notif_events_pending ON notification_events(status, scheduled_at) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX IF NOT EXISTS idx_notif_events_user_date ON notification_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_events_dedup ON notification_events(deduplication_key);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- push_subscriptions Policies
CREATE POLICY "Users can view own push subscriptions"
ON push_subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can register own push subscriptions"
ON push_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions"
ON push_subscriptions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
ON push_subscriptions FOR DELETE
USING (user_id = auth.uid());

-- notification_preferences Policies
CREATE POLICY "Users can view own notification preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- notifications Policies
CREATE POLICY "Users can view own in-app notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own in-app notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- notification_events Policies
CREATE POLICY "Owners can view events in gym"
ON notification_events FOR SELECT
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Users can view events directed to them"
ON notification_events FOR SELECT
USING (user_id = auth.uid());
