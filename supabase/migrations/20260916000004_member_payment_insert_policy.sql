-- Migration: Allow members to insert their own payment records via server-side API
-- The create-order API route already authenticates the user and verifies ownership
-- before inserting, so this policy is safe and correct.

DROP POLICY IF EXISTS "Members can insert their own payments" ON payments;
CREATE POLICY "Members can insert their own payments"
ON payments FOR INSERT
WITH CHECK (
  member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);
