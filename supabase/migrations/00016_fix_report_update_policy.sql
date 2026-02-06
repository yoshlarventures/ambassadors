-- Fix the report update policy to allow ambassadors to submit their draft reports
-- The issue was that USING checks existing row, but WITH CHECK (defaults to USING)
-- checks the new row, which fails when status changes from 'draft' to 'submitted'

DROP POLICY IF EXISTS "Ambassadors can update their own draft reports" ON reports;

CREATE POLICY "Ambassadors can update their own reports" ON reports
  FOR UPDATE
  USING (ambassador_id = auth.uid() AND status IN ('draft', 'rejected'))
  WITH CHECK (ambassador_id = auth.uid());
