-- Migration: Member Gamification System
-- Allows ambassadors to give points to members and members to submit tasks

-- Allow ambassadors to insert points for their club members
DROP POLICY IF EXISTS "System can insert points" ON points;
CREATE POLICY "Privileged users can insert points" ON points
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR is_ambassador(auth.uid()) OR is_regional_leader(auth.uid())
  );

-- Allow members to submit task completions
DROP POLICY IF EXISTS "Ambassadors can submit task completions" ON task_completions;
CREATE POLICY "Authenticated users can submit task completions" ON task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own task completions
DROP POLICY IF EXISTS "Users can view own task completions" ON task_completions;
CREATE POLICY "Users can view own task completions" ON task_completions
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to resubmit rejected tasks (update their own rejected completions)
DROP POLICY IF EXISTS "Users can resubmit rejected task completions" ON task_completions;
CREATE POLICY "Users can resubmit rejected task completions" ON task_completions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'rejected');

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_club_members_club_status ON club_members(club_id, status);
CREATE INDEX IF NOT EXISTS idx_points_reference ON points(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_status ON task_completions(user_id, status);
