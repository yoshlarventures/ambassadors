-- Fix RLS policies for clubs table to allow admin and regional leaders to create clubs

-- Drop existing admin policy and recreate with proper INSERT support
DROP POLICY IF EXISTS "Admins can manage all clubs" ON clubs;

CREATE POLICY "Admins can manage all clubs" ON clubs
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add policy for regional leaders to create clubs in their region
CREATE POLICY "Regional leaders can create clubs in their region" ON clubs
  FOR INSERT
  WITH CHECK (
    is_regional_leader(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.region_id = clubs.region_id
    )
  );

-- Add policy for regional leaders to update clubs in their region
CREATE POLICY "Regional leaders can update clubs in their region" ON clubs
  FOR UPDATE
  USING (
    is_regional_leader(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.region_id = clubs.region_id
    )
  );
