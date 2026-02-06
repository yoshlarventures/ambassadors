-- Ambassadors can only delete their own draft reports
-- Admins can delete any report

DROP POLICY IF EXISTS "Ambassadors can delete their own draft or rejected reports" ON reports;
DROP POLICY IF EXISTS "Ambassadors can delete their own draft reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete any report" ON reports;

-- Ambassadors: only draft reports
CREATE POLICY "Ambassadors can delete their own draft reports" ON reports
  FOR DELETE USING (ambassador_id = auth.uid() AND status = 'draft');

-- Admins: any report
CREATE POLICY "Admins can delete any report" ON reports
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
