-- ==============================================================================
-- Migration: 20260916000002_add_performance_indexes.sql
-- Description: Adds high-performance indexes on foreign keys and filtering columns
--              to eliminate sequential table scans and optimize response times.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_gym ON profiles(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

CREATE INDEX IF NOT EXISTS idx_workout_plans_member_status ON workout_plans(member_id, status);
CREATE INDEX IF NOT EXISTS idx_diet_plans_member_status ON diet_plans(member_id, status);
CREATE INDEX IF NOT EXISTS idx_member_notes_member ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_member ON progress_photos(member_id);

CREATE INDEX IF NOT EXISTS idx_members_gym_created ON members(gym_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gym_created ON payments(gym_id, created_at DESC);
