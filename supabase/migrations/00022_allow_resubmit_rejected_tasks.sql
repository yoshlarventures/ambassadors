-- Allow users to resubmit their rejected task completions
-- Drop the existing update policy
DROP POLICY IF EXISTS "task_completions_update_policy" ON task_completions;

-- Recreate with ability for users to update their own rejected completions
CREATE POLICY "task_completions_update_policy" ON task_completions
  FOR UPDATE
  USING (
    -- Admins can update any completion (approve/reject)
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Users can update their own rejected completions (resubmit)
    (user_id = auth.uid() AND status = 'rejected')
  )
  WITH CHECK (
    -- Admins can set any status
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Users can only resubmit (set status back to pending)
    (user_id = auth.uid() AND status = 'pending')
  );
