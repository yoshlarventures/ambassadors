-- Drop ALL existing policies on task_completions (regardless of name)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'task_completions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON task_completions', pol.policyname);
    END LOOP;
END $$;

-- Recreate policies with proper permissions

-- SELECT: Users can view their own, admins can view ALL
CREATE POLICY "task_completions_select_policy" ON task_completions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Ambassadors and regional leaders can submit their own completions
CREATE POLICY "task_completions_insert_policy" ON task_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ambassador', 'regional_leader'))
  );

-- UPDATE: Only admins can update (approve/reject)
CREATE POLICY "task_completions_update_policy" ON task_completions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: Only admins can delete
CREATE POLICY "task_completions_delete_policy" ON task_completions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Verify RLS is enabled
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
