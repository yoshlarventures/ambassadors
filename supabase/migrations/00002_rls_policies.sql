-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is regional leader
CREATE OR REPLACE FUNCTION is_regional_leader(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role = 'regional_leader' FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is ambassador
CREATE OR REPLACE FUNCTION is_ambassador(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role = 'ambassador' FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ================================
-- REGIONS POLICIES
-- ================================
CREATE POLICY "Regions are viewable by everyone" ON regions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert regions" ON regions
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update regions" ON regions
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete regions" ON regions
  FOR DELETE USING (is_admin(auth.uid()));

-- ================================
-- USERS POLICIES
-- ================================
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================
-- CLUBS POLICIES
-- ================================
CREATE POLICY "Clubs are viewable by everyone" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "Ambassadors can create their own club" ON clubs
  FOR INSERT WITH CHECK (
    auth.uid() = ambassador_id AND
    is_ambassador(auth.uid())
  );

CREATE POLICY "Ambassadors can update their own club" ON clubs
  FOR UPDATE USING (auth.uid() = ambassador_id);

CREATE POLICY "Admins can manage all clubs" ON clubs
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- CLUB MEMBERS POLICIES
-- ================================
CREATE POLICY "Club members are viewable by everyone" ON club_members
  FOR SELECT USING (true);

CREATE POLICY "Users can request to join clubs" ON club_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ambassadors can manage their club members" ON club_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = club_members.club_id AND clubs.ambassador_id = auth.uid()
    )
  );

CREATE POLICY "Ambassadors can delete club members" ON club_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = club_members.club_id AND clubs.ambassador_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave clubs" ON club_members
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- CLUB GALLERY POLICIES
-- ================================
CREATE POLICY "Club gallery is viewable by everyone" ON club_gallery
  FOR SELECT USING (true);

CREATE POLICY "Ambassadors can manage their club gallery" ON club_gallery
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = club_gallery.club_id AND clubs.ambassador_id = auth.uid()
    )
  );

-- ================================
-- EVENTS POLICIES
-- ================================
CREATE POLICY "Approved events are viewable by everyone" ON events
  FOR SELECT USING (
    status = 'approved' OR
    status = 'completed' OR
    organizer_id = auth.uid() OR
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM event_collaborators WHERE event_collaborators.event_id = events.id AND event_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Ambassadors and leads can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND
    (is_ambassador(auth.uid()) OR is_regional_leader(auth.uid()))
  );

CREATE POLICY "Organizers can update their events" ON events
  FOR UPDATE USING (
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_collaborators WHERE event_collaborators.event_id = events.id AND event_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all events" ON events
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- EVENT COLLABORATORS POLICIES
-- ================================
CREATE POLICY "Event collaborators are viewable by everyone" ON event_collaborators
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage collaborators" ON event_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_collaborators.event_id AND events.organizer_id = auth.uid()
    )
  );

-- ================================
-- EVENT REGISTRATIONS POLICIES
-- ================================
CREATE POLICY "Event registrations are viewable by organizers" ON event_registrations
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND (
        events.organizer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM event_collaborators WHERE event_collaborators.event_id = events.id AND event_collaborators.user_id = auth.uid()
        )
      )
    ) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registration" ON event_registrations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update attendance" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND (
        events.organizer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM event_collaborators WHERE event_collaborators.event_id = events.id AND event_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- ================================
-- EVENT PHOTOS POLICIES
-- ================================
CREATE POLICY "Event photos are viewable by everyone" ON event_photos
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage photos" ON event_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_photos.event_id AND (
        events.organizer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM event_collaborators WHERE event_collaborators.event_id = events.id AND event_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- ================================
-- SESSIONS POLICIES
-- ================================
CREATE POLICY "Sessions are viewable by everyone" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Ambassadors can manage their club sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = sessions.club_id AND clubs.ambassador_id = auth.uid()
    )
  );

-- ================================
-- SESSION ATTENDANCE POLICIES
-- ================================
CREATE POLICY "Session attendance is viewable by club members" ON session_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clubs ON clubs.id = sessions.club_id
      WHERE sessions.id = session_attendance.session_id AND (
        clubs.ambassador_id = auth.uid() OR
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
      WHERE sessions.id = session_attendance.session_id AND clubs.ambassador_id = auth.uid()
    )
  );

-- ================================
-- REPORTS POLICIES
-- ================================
CREATE POLICY "Ambassadors can view their own reports" ON reports
  FOR SELECT USING (
    ambassador_id = auth.uid() OR
    is_admin(auth.uid()) OR
    (
      is_regional_leader(auth.uid()) AND
      EXISTS (
        SELECT 1 FROM clubs
        JOIN users ON users.region_id = clubs.region_id
        WHERE clubs.id = reports.club_id AND users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Ambassadors can create their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = ambassador_id);

CREATE POLICY "Ambassadors can update their own draft reports" ON reports
  FOR UPDATE USING (
    ambassador_id = auth.uid() AND status = 'draft'
  );

CREATE POLICY "Regional leaders can review reports in their region" ON reports
  FOR UPDATE USING (
    is_regional_leader(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM clubs
      JOIN users ON users.region_id = clubs.region_id
      WHERE clubs.id = reports.club_id AND users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reports" ON reports
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- POINTS POLICIES
-- ================================
CREATE POLICY "Users can view their own points" ON points
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Points are viewable for leaderboard" ON points
  FOR SELECT USING (true);

CREATE POLICY "System can insert points" ON points
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ================================
-- ACHIEVEMENTS POLICIES
-- ================================
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON achievements
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- USER ACHIEVEMENTS POLICIES
-- ================================
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can award achievements" ON user_achievements
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ================================
-- TASKS POLICIES
-- ================================
CREATE POLICY "Active tasks are viewable by ambassadors" ON tasks
  FOR SELECT USING (
    is_active = true OR
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- TASK COMPLETIONS POLICIES
-- ================================
CREATE POLICY "Users can view their own task completions" ON task_completions
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Ambassadors can submit task completions" ON task_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    is_ambassador(auth.uid())
  );

CREATE POLICY "Admins can manage task completions" ON task_completions
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- RESOURCE CATEGORIES POLICIES
-- ================================
CREATE POLICY "Resource categories are viewable by everyone" ON resource_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage resource categories" ON resource_categories
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- RESOURCES POLICIES
-- ================================
CREATE POLICY "Resources are viewable by authenticated users" ON resources
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage resources" ON resources
  FOR ALL USING (is_admin(auth.uid()));

-- ================================
-- NOTIFICATIONS POLICIES
-- ================================
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);
