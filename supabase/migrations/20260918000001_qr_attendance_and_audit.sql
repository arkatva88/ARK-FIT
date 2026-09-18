-- ==============================================================================
-- ARK FIT — Migration: QR Attendance & Emergency Audit Logging
-- ==============================================================================

-- 1. Add qr_code_token to gyms if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gyms' AND column_name = 'qr_code_token'
  ) THEN 
    ALTER TABLE gyms ADD COLUMN qr_code_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
    UPDATE gyms SET qr_code_token = encode(gen_random_bytes(16), 'hex') WHERE qr_code_token IS NULL;
    ALTER TABLE gyms ALTER COLUMN qr_code_token SET NOT NULL;
  END IF;
END $$;

-- 2. Add method and audit columns to attendance if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'method'
  ) THEN 
    ALTER TABLE attendance ADD COLUMN method TEXT NOT NULL DEFAULT 'MANUAL_OWNER';
    ALTER TABLE attendance ADD CONSTRAINT check_attendance_method 
      CHECK (method IN ('QR', 'MANUAL_OWNER', 'MANUAL_TRAINER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'recorded_by'
  ) THEN 
    ALTER TABLE attendance ADD COLUMN recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'updated_by'
  ) THEN 
    ALTER TABLE attendance ADD COLUMN updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'updated_at'
  ) THEN 
    ALTER TABLE attendance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Create audit_logs table for security and admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Recreate policies for audit_logs
DROP POLICY IF EXISTS "Allow gym staff select own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow service role manage audit logs" ON audit_logs;

CREATE POLICY "Allow gym staff select own audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (gym_id IN (
    SELECT gym_id FROM profiles WHERE id = auth.uid() AND role IN ('OWNER', 'TRAINER')
  ));

CREATE POLICY "Allow service role manage audit logs" ON audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for audit log lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_event ON audit_logs(gym_id, event_type, created_at DESC);
