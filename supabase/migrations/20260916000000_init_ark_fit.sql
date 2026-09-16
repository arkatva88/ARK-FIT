-- ==============================================================================
-- ARK FIT Gym Management System - Initial Production Schema Migration
-- Designed for individual Indian Gyms (100-200 members) with multi-tenant scoping
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'TRAINER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_type AS ENUM ('NORMAL', 'PT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'FROZEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'RAZORPAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PAID', 'PENDING', 'OVERDUE', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pt_session_status AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pt_package_status AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exercise_category AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'CORE', 'CARDIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE diet_goal AS ENUM ('MUSCLE_GAIN', 'FAT_LOSS', 'MAINTENANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_status AS ENUM ('OPEN', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- Gyms Table (Multi-tenant root)
CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table (Links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    role user_role NOT NULL DEFAULT 'MEMBER',
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    specialization TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    member_type member_type NOT NULL DEFAULT 'NORMAL',
    assigned_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    status member_status NOT NULL DEFAULT 'ACTIVE',
    membership_expiry DATE,
    emergency_contact TEXT,
    medical_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PT Packages Table
CREATE TABLE IF NOT EXISTS pt_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    package_name TEXT NOT NULL,
    total_sessions INT NOT NULL CHECK (total_sessions > 0),
    used_sessions INT NOT NULL DEFAULT 0 CHECK (used_sessions >= 0),
    remaining_sessions INT NOT NULL CHECK (remaining_sessions >= 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status pt_package_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_pt_session_counts CHECK (used_sessions + remaining_sessions = total_sessions)
);

-- PT Sessions Table
CREATE TABLE IF NOT EXISTS pt_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES pt_packages(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    session_number INT NOT NULL CHECK (session_number > 0),
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    status pt_session_status NOT NULL DEFAULT 'SCHEDULED',
    workout_notes TEXT,
    trainer_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (package_id, session_number)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id, member_id, attendance_date)
);

-- Payments Table (Supports Cash, UPI, Razorpay)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
    pt_package_id UUID REFERENCES pt_packages(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    status payment_status NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise Library (Global or Gym-specific)
CREATE TABLE IF NOT EXISTS exercise_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category exercise_category NOT NULL,
    instructions TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout Plans (Assigned to Member)
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    days JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_pt_workout BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Diet Plans (Assigned to Member)
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    goal diet_goal NOT NULL DEFAULT 'MUSCLE_GAIN',
    calories INT NOT NULL CHECK (calories > 0),
    protein_grams INT NOT NULL CHECK (protein_grams >= 0),
    meals JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progress Records (Weight, Measurements, Strength)
CREATE TABLE IF NOT EXISTS progress_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2),
    chest_inches NUMERIC(4,1),
    waist_inches NUMERIC(4,1),
    arms_inches NUMERIC(4,1),
    thighs_inches NUMERIC(4,1),
    bench_press_kg NUMERIC(5,2),
    squat_kg NUMERIC(5,2),
    deadlift_kg NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id, member_id, recorded_at)
);

-- Progress Photos (Private, signed URLs)
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    view_type TEXT NOT NULL DEFAULT 'FRONT' CHECK (view_type IN ('FRONT', 'SIDE', 'BACK')),
    taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member Structured Notes (Form, Discomfort, Observations - No realtime chat)
CREATE TABLE IF NOT EXISTS member_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status note_status NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES (Optimized for 100-200 member queries, avoiding over-indexing)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_gym_status ON members(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_members_gym_type ON members(gym_id, member_type);
CREATE INDEX IF NOT EXISTS idx_members_gym_trainer ON members(gym_id, assigned_trainer_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_expiry ON members(gym_id, membership_expiry);

CREATE INDEX IF NOT EXISTS idx_attendance_gym_date ON attendance(gym_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_member_date ON attendance(gym_id, member_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_payments_gym_status ON payments(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_gym_due ON payments(gym_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_gym_member_status ON payments(gym_id, member_id, status);

CREATE INDEX IF NOT EXISTS idx_pt_packages_gym_member ON pt_packages(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_pt_packages_gym_trainer ON pt_packages(gym_id, trainer_id);

CREATE INDEX IF NOT EXISTS idx_pt_sessions_gym_trainer_date ON pt_sessions(gym_id, trainer_id, session_date);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_gym_member_date ON pt_sessions(gym_id, member_id, session_date);

CREATE INDEX IF NOT EXISTS idx_progress_gym_member_date ON progress_records(gym_id, member_id, recorded_at);

-- ------------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS & BUSINESS LOGIC PROCEDURES
-- ------------------------------------------------------------------------------

-- Helper to retrieve current user's gym_id safely
CREATE OR REPLACE FUNCTION get_auth_gym_id()
RETURNS UUID AS $$
    SELECT gym_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to retrieve current user's role safely
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Atomic Stored Procedure: Complete a PT Session safely
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

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by users in the same gym"
ON profiles FOR SELECT
USING (gym_id = get_auth_gym_id());

CREATE POLICY "Users can update their own safe profile data"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Owners can manage all profiles in their gym"
ON profiles FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

-- Gyms Policies
CREATE POLICY "Users can view their own gym details"
ON gyms FOR SELECT
USING (id = get_auth_gym_id());

CREATE POLICY "Owners can update their gym details"
ON gyms FOR UPDATE
USING (id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

-- Members Policies
CREATE POLICY "Owners have full access to members"
ON members FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can view members in their gym"
ON members FOR SELECT
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

CREATE POLICY "Members can view only their own record"
ON members FOR SELECT
USING (profile_id = auth.uid());

-- Attendance Policies
CREATE POLICY "Owners have full access to attendance"
ON attendance FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can view and mark attendance"
ON attendance FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

CREATE POLICY "Members can view only their own attendance"
ON attendance FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Payments Policies (Trainers have NO access)
CREATE POLICY "Owners have full access to payments"
ON payments FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Members can view only their own payments"
ON payments FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- PT Packages Policies
CREATE POLICY "Owners have full access to PT packages"
ON pt_packages FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can view PT packages assigned to them"
ON pt_packages FOR SELECT
USING (
    gym_id = get_auth_gym_id() AND 
    trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
);

CREATE POLICY "Members can view their own PT package"
ON pt_packages FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- PT Sessions Policies
CREATE POLICY "Owners have full access to PT sessions"
ON pt_sessions FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can manage PT sessions assigned to them"
ON pt_sessions FOR ALL
USING (
    gym_id = get_auth_gym_id() AND 
    trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
);

CREATE POLICY "Members can view only their own PT sessions"
ON pt_sessions FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Workout Plans Policies
CREATE POLICY "Owners can manage workout plans in their gym"
ON workout_plans FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can manage workout plans in their gym"
ON workout_plans FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

CREATE POLICY "Members can view their own workout plans"
ON workout_plans FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Diet Plans Policies
CREATE POLICY "Owners can manage diet plans in their gym"
ON diet_plans FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can manage diet plans in their gym"
ON diet_plans FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

CREATE POLICY "Members can view their own diet plan"
ON diet_plans FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Progress Records & Photos Policies
CREATE POLICY "Owners have access to progress in their gym"
ON progress_records FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can view and log progress for assigned members"
ON progress_records FOR ALL
USING (
    gym_id = get_auth_gym_id() AND (
        get_auth_role() = 'TRAINER' AND 
        member_id IN (SELECT id FROM members WHERE assigned_trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid()))
    )
);

CREATE POLICY "Members can view their own progress records"
ON progress_records FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Members can insert their own progress records"
ON progress_records FOR INSERT
WITH CHECK (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Progress Photos Policies
CREATE POLICY "Owners can view progress photos in their gym"
ON progress_photos FOR SELECT
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can view progress photos of their assigned members"
ON progress_photos FOR SELECT
USING (
    gym_id = get_auth_gym_id() AND 
    member_id IN (SELECT id FROM members WHERE assigned_trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid()))
);

CREATE POLICY "Members can manage their own progress photos"
ON progress_photos FOR ALL
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()))
WITH CHECK (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Member Notes Policies (Discomfort & Form Observations)
CREATE POLICY "Owners have access to all notes in their gym"
ON member_notes FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');

CREATE POLICY "Trainers can manage notes for members in their gym"
ON member_notes FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'TRAINER');

CREATE POLICY "Members can view resolved/shared notes for themselves"
ON member_notes FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Exercise Library Policies
CREATE POLICY "Exercise library is viewable by all authenticated users"
ON exercise_library FOR SELECT
TO authenticated
USING (gym_id IS NULL OR gym_id = get_auth_gym_id());

CREATE POLICY "Owners can manage exercise library"
ON exercise_library FOR ALL
USING (gym_id = get_auth_gym_id() AND get_auth_role() = 'OWNER');
