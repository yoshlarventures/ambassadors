-- Fix task completions RLS policies for proper admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own task completions" ON task_completions;
DROP POLICY IF EXISTS "Admins can manage task completions" ON task_completions;
DROP POLICY IF EXISTS "Ambassadors can submit task completions" ON task_completions;

-- Recreate with proper NULL handling (using direct role check instead of helper function)

-- SELECT: Users can view their own, admins can view all
CREATE POLICY "task_completions_select" ON task_completions
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: Ambassadors can submit their own completions
CREATE POLICY "task_completions_insert" ON task_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'ambassador'
  );

-- UPDATE: Only admins can update (approve/reject)
CREATE POLICY "task_completions_update" ON task_completions
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- DELETE: Only admins can delete
CREATE POLICY "task_completions_delete" ON task_completions
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Also fix tasks policies to allow regional leaders to view active tasks

-- Drop existing task policies
DROP POLICY IF EXISTS "Active tasks are viewable by ambassadors" ON tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;

-- Recreate - active tasks viewable by all authenticated, admins can see all
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    is_active = true OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks_admin_manage" ON tasks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Fix points policies for proper admin access
DROP POLICY IF EXISTS "Users can view their own points" ON points;
DROP POLICY IF EXISTS "Admins can manage points" ON points;

CREATE POLICY "points_select" ON points
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'regional_leader')
  );

CREATE POLICY "points_admin_insert" ON points
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "points_admin_update" ON points
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "points_admin_delete" ON points
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
