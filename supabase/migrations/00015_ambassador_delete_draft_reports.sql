-- Allow ambassadors to delete their own draft or rejected reports
CREATE POLICY "Ambassadors can delete their own draft or rejected reports" ON reports
  FOR DELETE USING (ambassador_id = auth.uid() AND status IN ('draft', 'rejected'));
