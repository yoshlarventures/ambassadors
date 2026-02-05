-- Migration: Add support for multiple ambassadors per club
-- This creates a junction table and migrates existing data

-- Create club_ambassadors junction table
CREATE TABLE club_ambassadors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, ambassador_id)
);

-- Create index for performance
CREATE INDEX idx_club_ambassadors_club ON club_ambassadors(club_id);
CREATE INDEX idx_club_ambassadors_ambassador ON club_ambassadors(ambassador_id);

-- Migrate existing data: copy ambassador_id from clubs to club_ambassadors
INSERT INTO club_ambassadors (club_id, ambassador_id, is_primary)
SELECT id, ambassador_id, TRUE
FROM clubs
WHERE ambassador_id IS NOT NULL;

-- Enable RLS on the new table
ALTER TABLE club_ambassadors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_ambassadors
CREATE POLICY "Club ambassadors are viewable by everyone" ON club_ambassadors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage club ambassadors" ON club_ambassadors
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Regional leaders can manage club ambassadors in their region" ON club_ambassadors
  FOR ALL USING (
    is_regional_leader(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM clubs
      JOIN users ON users.id = auth.uid()
      WHERE clubs.id = club_ambassadors.club_id
      AND clubs.region_id = users.region_id
    )
  );

-- Helper function to check if user is an ambassador of a club
CREATE OR REPLACE FUNCTION is_club_ambassador(user_id UUID, p_club_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_ambassadors
    WHERE club_ambassadors.club_id = p_club_id
    AND club_ambassadors.ambassador_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Update existing RLS policies that reference clubs.ambassador_id

-- Drop old club policies that reference ambassador_id
DROP POLICY IF EXISTS "Ambassadors can create their own club" ON clubs;
DROP POLICY IF EXISTS "Ambassadors can update their own club" ON clubs;

-- Create new club policies using the junction table
CREATE POLICY "Ambassadors can update their own club" ON clubs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_ambassadors
      WHERE club_ambassadors.club_id = clubs.id
      AND club_ambassadors.ambassador_id = auth.uid()
    )
  );

-- Drop old club_members policies
DROP POLICY IF EXISTS "Ambassadors can manage their club members" ON club_members;
DROP POLICY IF EXISTS "Ambassadors can delete club members" ON club_members;

-- Create new club_members policies
CREATE POLICY "Ambassadors can manage their club members" ON club_members
  FOR UPDATE USING (
    is_club_ambassador(auth.uid(), club_members.club_id)
  );

CREATE POLICY "Ambassadors can delete club members" ON club_members
  FOR DELETE USING (
    is_club_ambassador(auth.uid(), club_members.club_id)
  );

-- Drop old club_gallery policy
DROP POLICY IF EXISTS "Ambassadors can manage their club gallery" ON club_gallery;

-- Create new club_gallery policy
CREATE POLICY "Ambassadors can manage their club gallery" ON club_gallery
  FOR ALL USING (
    is_club_ambassador(auth.uid(), club_gallery.club_id)
  );

-- Drop old sessions policy
DROP POLICY IF EXISTS "Ambassadors can manage their club sessions" ON sessions;

-- Create new sessions policy
CREATE POLICY "Ambassadors can manage their club sessions" ON sessions
  FOR ALL USING (
    is_club_ambassador(auth.uid(), sessions.club_id)
  );

-- Drop old session_attendance policies
DROP POLICY IF EXISTS "Session attendance is viewable by club members" ON session_attendance;
DROP POLICY IF EXISTS "Ambassadors can manage session attendance" ON session_attendance;

-- Create new session_attendance policies
CREATE POLICY "Session attendance is viewable by club members" ON session_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clubs ON clubs.id = sessions.club_id
      WHERE sessions.id = session_attendance.session_id AND (
        is_club_ambassador(auth.uid(), clubs.id) OR
        EXISTS (
          SELECT 1 FROM club_members WHERE club_members.club_id = clubs.id AND club_members.user_id = auth.uid()
        )
      )
    ) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Ambassadors can manage session attendance" ON session_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clubs ON clubs.id = sessions.club_id
      WHERE sessions.id = session_attendance.session_id
      AND is_club_ambassador(auth.uid(), clubs.id)
    )
  );

-- Now we can safely remove the ambassador_id column from clubs
-- First drop the unique constraint
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_ambassador_id_key;

-- Then drop the column
ALTER TABLE clubs DROP COLUMN ambassador_id;
