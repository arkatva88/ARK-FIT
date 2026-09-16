-- ==============================================================================
-- Migration: 20260916000001_fix_trainer_membership_rls.sql
-- Description: Adds essential RLS policies for trainers and memberships tables,
--              defines get_auth_trainer_id() helper, and optimizes PT & progress policies.
-- ==============================================================================

-- 1. Helper function to get current user's trainer ID safely (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION get_auth_trainer_id()
RETURNS UUID AS $$
    SELECT id FROM trainers WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Trainers Policies
DROP POLICY IF EXISTS "Trainers are viewable by users in the same gym" ON trainers;
CREATE POLICY "Trainers are viewable by users in the same gym"
ON trainers FOR SELECT
USING (gym_id = get_auth_gym_id());

DROP POLICY IF EXISTS "Owners have full access to trainers" ON trainers;
CREATE POLICY "Owners have full access to trainers"
ON trainers FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

DROP POLICY IF EXISTS "Trainers can update their own profile" ON trainers;
CREATE POLICY "Trainers can update their own profile"
ON trainers FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- 3. Memberships Policies
DROP POLICY IF EXISTS "Owners have full access to memberships" ON memberships;
CREATE POLICY "Owners have full access to memberships"
ON memberships FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

DROP POLICY IF EXISTS "Members can view their own memberships" ON memberships;
CREATE POLICY "Members can view their own memberships"
ON memberships FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Trainers can view memberships in their gym" ON memberships;
CREATE POLICY "Trainers can view memberships in their gym"
ON memberships FOR SELECT
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

-- 4. Update PT Packages policies for Trainers
DROP POLICY IF EXISTS "Trainers can view PT packages assigned to them" ON pt_packages;
CREATE POLICY "Trainers can view PT packages assigned to them"
ON pt_packages FOR SELECT
USING (
    gym_id = get_auth_gym_id() AND 
    trainer_id = get_auth_trainer_id()
);

-- 5. Update PT Sessions policies for Trainers
DROP POLICY IF EXISTS "Trainers can manage PT sessions assigned to them" ON pt_sessions;
CREATE POLICY "Trainers can manage PT sessions assigned to them"
ON pt_sessions FOR ALL
USING (
    gym_id = get_auth_gym_id() AND 
    trainer_id = get_auth_trainer_id()
)
WITH CHECK (
    gym_id = get_auth_gym_id() AND 
    trainer_id = get_auth_trainer_id()
);

-- 6. Update Progress Records & Photos policies for Trainers
DROP POLICY IF EXISTS "Trainers can view and log progress for assigned members" ON progress_records;
CREATE POLICY "Trainers can view and log progress for assigned members"
ON progress_records FOR ALL
USING (
    gym_id = get_auth_gym_id() AND (
        get_auth_role() = 'TRAINER' AND 
        member_id IN (SELECT id FROM members WHERE assigned_trainer_id = get_auth_trainer_id())
    )
)
WITH CHECK (
    gym_id = get_auth_gym_id() AND (
        get_auth_role() = 'TRAINER' AND 
        member_id IN (SELECT id FROM members WHERE assigned_trainer_id = get_auth_trainer_id())
    )
);

DROP POLICY IF EXISTS "Trainers can view progress photos of their assigned members" ON progress_photos;
CREATE POLICY "Trainers can view progress photos of their assigned members"
ON progress_photos FOR SELECT
USING (
    gym_id = get_auth_gym_id() AND 
    member_id IN (SELECT id FROM members WHERE assigned_trainer_id = get_auth_trainer_id())
);

-- 7. Ensure Member Notes policy allows Trainers to insert notes
DROP POLICY IF EXISTS "Trainers can manage notes for members in their gym" ON member_notes;
CREATE POLICY "Trainers can manage notes for members in their gym"
ON member_notes FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER')
WITH CHECK (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

-- 8. Hardened Atomic Stored Procedure: Complete a PT Session safely
CREATE OR REPLACE FUNCTION complete_pt_session(
    p_session_id UUID,
    p_trainer_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_package RECORD;
BEGIN
    -- 1. Fetch and lock session
    SELECT * INTO v_session
    FROM pt_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- Security: verify caller is the assigned trainer or gym owner
    IF get_auth_role() != 'OWNER' AND v_session.trainer_id != get_auth_trainer_id() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the assigned trainer for this session');
    END IF;

    IF v_session.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is already marked as completed');
    END IF;

    -- 2. Fetch and lock package
    SELECT * INTO v_package
    FROM pt_packages
    WHERE id = v_session.package_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associated PT package not found');
    END IF;

    IF v_package.remaining_sessions <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No remaining sessions in package');
    END IF;

    -- 3. Update session
    UPDATE pt_sessions
    SET status = 'COMPLETED',
        trainer_notes = COALESCE(p_trainer_notes, trainer_notes),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;

    -- 4. Update package counters atomically
    UPDATE pt_packages
    SET used_sessions = used_sessions + 1,
        remaining_sessions = remaining_sessions - 1,
        status = CASE WHEN remaining_sessions - 1 = 0 THEN 'COMPLETED'::pt_package_status ELSE status END,
        updated_at = NOW()
    WHERE id = v_session.package_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', p_session_id,
        'remaining_sessions', v_package.remaining_sessions - 1,
        'used_sessions', v_package.used_sessions + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

