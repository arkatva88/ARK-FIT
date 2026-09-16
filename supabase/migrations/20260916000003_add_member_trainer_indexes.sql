-- Additional targeted performance indexes for high-frequency queries
-- Applied to eliminate sequential table scans on mobile & desktop dashboards

CREATE INDEX IF NOT EXISTS idx_trainers_gym ON public.trainers USING btree (gym_id);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_trainer_date ON public.pt_sessions USING btree (trainer_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON public.attendance USING btree (member_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_member_created ON public.payments USING btree (member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_packages_member_status ON public.pt_packages USING btree (member_id, status);
