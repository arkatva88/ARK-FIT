-- ==============================================================================
-- ARK FIT - Real-World Operational Refinement Migration
-- 1. Adds timezone support to gyms
-- 2. Creates workout_schedules table for operational workout execution & rescheduling
-- 3. Adds robust stored procedures for PT Session scheduling, rescheduling & cancellation
-- 4. Ensures RLS policies and backfills missing memberships for existing members
-- ==============================================================================

-- 1. Enhance gyms table with timezone
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- 2. Create workout_schedules table
CREATE TABLE IF NOT EXISTS workout_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    workout_date DATE NOT NULL,
    day_name TEXT NOT NULL,
    title TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'SKIPPED', 'CANCELLED')),
    completed_at TIMESTAMPTZ,
    completed_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    rescheduled_to_date DATE,
    rescheduled_from_id UUID REFERENCES workout_schedules(id) ON DELETE SET NULL,
    rescheduled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_sched_member_date ON workout_schedules(gym_id, member_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_sched_status_date ON workout_schedules(gym_id, status, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_sched_trainer_date ON workout_schedules(gym_id, trainer_id, workout_date);

-- Enable RLS
ALTER TABLE workout_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_schedules
DROP POLICY IF EXISTS "Owners have full access to workout schedules" ON workout_schedules;
CREATE POLICY "Owners have full access to workout schedules"
ON workout_schedules FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

DROP POLICY IF EXISTS "Trainers have full access to workout schedules in their gym" ON workout_schedules;
CREATE POLICY "Trainers have full access to workout schedules in their gym"
ON workout_schedules FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

DROP POLICY IF EXISTS "Members can view their own workout schedules" ON workout_schedules;
CREATE POLICY "Members can view their own workout schedules"
ON workout_schedules FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Members can update their own workout schedules" ON workout_schedules;
CREATE POLICY "Members can update their own workout schedules"
ON workout_schedules FOR UPDATE
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()))
WITH CHECK (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- 3. Stored Procedures for PT Sessions

-- Stored Procedure: Schedule a PT Session
CREATE OR REPLACE FUNCTION schedule_pt_session(
    p_package_id UUID,
    p_session_date DATE,
    p_session_time TIME,
    p_workout_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_package RECORD;
    v_next_session_number INT;
    v_new_session_id UUID;
BEGIN
    -- 1. Fetch and lock package
    SELECT * INTO v_package
    FROM pt_packages
    WHERE id = p_package_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'PT package not found');
    END IF;

    IF v_package.status != 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'PT package is not active');
    END IF;

    IF v_package.remaining_sessions <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No remaining sessions in package quota');
    END IF;

    IF v_package.expiry_date < CURRENT_DATE THEN
        RETURN jsonb_build_object('success', false, 'error', 'PT package expired on ' || v_package.expiry_date);
    END IF;

    -- Security: verify caller is the assigned trainer or gym owner
    IF get_auth_role() != 'OWNER' AND v_package.trainer_id != get_auth_trainer_id() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the coach assigned to this package');
    END IF;

    -- 2. Determine next session number
    SELECT COALESCE(MAX(session_number), 0) + 1 INTO v_next_session_number
    FROM pt_sessions
    WHERE package_id = p_package_id;

    IF v_next_session_number > v_package.total_sessions THEN
        RETURN jsonb_build_object('success', false, 'error', 'All sessions for this package have already been scheduled');
    END IF;

    -- 3. Insert session
    INSERT INTO pt_sessions (
        gym_id,
        package_id,
        member_id,
        trainer_id,
        session_number,
        session_date,
        session_time,
        status,
        workout_notes
    ) VALUES (
        v_package.gym_id,
        p_package_id,
        v_package.member_id,
        v_package.trainer_id,
        v_next_session_number,
        p_session_date,
        p_session_time,
        'SCHEDULED',
        p_workout_notes
    )
    RETURNING id INTO v_new_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_new_session_id,
        'session_number', v_next_session_number,
        'session_date', p_session_date,
        'session_time', p_session_time
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Reschedule a PT Session
CREATE OR REPLACE FUNCTION reschedule_pt_session(
    p_session_id UUID,
    p_new_date DATE,
    p_new_time TIME,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session
    FROM pt_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    IF v_session.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot reschedule an already completed session');
    END IF;

    -- Security check: caller must be trainer assigned or owner
    IF get_auth_role() != 'OWNER' AND v_session.trainer_id != get_auth_trainer_id() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to reschedule this session');
    END IF;

    UPDATE pt_sessions
    SET session_date = p_new_date,
        session_time = p_new_time,
        trainer_notes = COALESCE(p_notes, trainer_notes),
        status = 'SCHEDULED',
        updated_at = NOW()
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', p_session_id,
        'new_date', p_new_date,
        'new_time', p_new_time
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Cancel a PT Session
CREATE OR REPLACE FUNCTION cancel_pt_session(
    p_session_id UUID,
    p_restore_quota BOOLEAN DEFAULT TRUE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session
    FROM pt_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    IF v_session.status = 'CANCELLED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is already cancelled');
    END IF;

    -- Security check
    IF get_auth_role() != 'OWNER' AND v_session.trainer_id != get_auth_trainer_id() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to cancel this session');
    END IF;

    -- If session was previously COMPLETED and now being cancelled with restore:
    IF v_session.status = 'COMPLETED' AND p_restore_quota THEN
        UPDATE pt_packages
        SET used_sessions = GREATEST(0, used_sessions - 1),
            remaining_sessions = remaining_sessions + 1,
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = v_session.package_id;
    END IF;

    UPDATE pt_sessions
    SET status = 'CANCELLED',
        trainer_notes = COALESCE(p_notes, trainer_notes),
        updated_at = NOW()
    WHERE id = p_session_id;

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill missing memberships for existing members
INSERT INTO memberships (gym_id, member_id, plan_name, amount, start_date, expiry_date, status)
SELECT 
    m.gym_id,
    m.id,
    'Monthly All-Access',
    1500.00,
    COALESCE(m.membership_expiry - INTERVAL '30 days', CURRENT_DATE)::DATE,
    COALESCE(m.membership_expiry, (CURRENT_DATE + INTERVAL '30 days')::DATE),
    CASE 
        WHEN m.membership_expiry >= CURRENT_DATE THEN 'ACTIVE'::membership_status 
        ELSE 'EXPIRED'::membership_status 
    END
FROM members m
WHERE NOT EXISTS (
    SELECT 1 FROM memberships ms WHERE ms.member_id = m.id
);

-- Link existing payments to memberships where null
UPDATE payments p
SET membership_id = (
    SELECT ms.id FROM memberships ms WHERE ms.member_id = p.member_id ORDER BY ms.created_at DESC LIMIT 1
)
WHERE p.membership_id IS NULL;
