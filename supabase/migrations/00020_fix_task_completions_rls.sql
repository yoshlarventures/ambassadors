-- Fix task completions RLS policies and add regional leader support

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own task completions" ON task_completions;
DROP POLICY IF EXISTS "Admins can manage task completions" ON task_completions;
DROP POLICY IF EXISTS "Ambassadors can submit task completions" ON task_completions;

-- Recreate with proper NULL handling and regional leader support

-- SELECT: Users can view their own, admins can view all, regional leaders can view their region's
CREATE POLICY "task_completions_select" ON task_completions
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR
    (
      (SELECT role FROM users WHERE id = auth.uid()) = 'regional_leader' AND
      user_id IN (
        SELECT id FROM users
        WHERE region_id = (SELECT region_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- INSERT: Ambassadors can submit their own completions
CREATE POLICY "task_completions_insert" ON task_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ambassador', 'regional_leader')
  );

-- UPDATE: Admins and regional leaders (for their region) can update
CREATE POLICY "task_completions_update" ON task_completions
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR
    (
      (SELECT role FROM users WHERE id = auth.uid()) = 'regional_leader' AND
      user_id IN (
        SELECT id FROM users
        WHERE region_id = (SELECT region_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- DELETE: Only admins can delete
CREATE POLICY "task_completions_delete" ON task_completions
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Also fix tasks policies to allow regional leaders to view

-- Drop existing task policies
DROP POLICY IF EXISTS "Active tasks are viewable by ambassadors" ON tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;

-- Recreate with regional leader support
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    is_active = true OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'regional_leader')
  );

CREATE POLICY "tasks_admin_manage" ON tasks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Also allow regional leaders to view points
DROP POLICY IF EXISTS "Users can view their own points" ON points;
DROP POLICY IF EXISTS "Admins can manage points" ON points;

CREATE POLICY "points_select" ON points
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR
    (
      (SELECT role FROM users WHERE id = auth.uid()) = 'regional_leader' AND
      user_id IN (
        SELECT id FROM users
        WHERE region_id = (SELECT region_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "points_admin_insert" ON points
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'regional_leader')
  );

CREATE POLICY "points_admin_manage" ON points
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "points_admin_delete" ON points
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
