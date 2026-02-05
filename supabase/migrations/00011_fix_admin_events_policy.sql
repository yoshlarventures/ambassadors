-- Fix admin events policy to allow INSERT
-- The FOR ALL USING clause doesn't work properly for INSERT, need WITH CHECK

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Create separate policies for admin
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all events" ON events
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all events" ON events
  FOR DELETE USING (is_admin(auth.uid()));
