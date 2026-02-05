-- Fix infinite recursion in events policies
-- The issue is circular dependency between events and event_collaborators policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Approved events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Organizers can update their events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Event organizers can manage collaborators" ON event_collaborators;

-- Create a helper function to check if user is event collaborator (avoids recursion)
CREATE OR REPLACE FUNCTION is_event_collaborator(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_collaborators
    WHERE event_id = event_uuid AND user_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create a helper function to check if user is event organizer (avoids recursion)
CREATE OR REPLACE FUNCTION is_event_organizer(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = event_uuid AND organizer_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Recreate events policies without circular references
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (
    status = 'approved' OR
    status = 'completed' OR
    organizer_id = auth.uid() OR
    is_admin(auth.uid()) OR
    is_event_collaborator(id, auth.uid())
  );

CREATE POLICY "Organizers can update their events" ON events
  FOR UPDATE USING (
    organizer_id = auth.uid() OR
    is_event_collaborator(id, auth.uid()) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (is_admin(auth.uid()));

-- Recreate event_collaborators policy without circular reference
CREATE POLICY "Event collaborators viewable by all" ON event_collaborators
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can insert collaborators" ON event_collaborators
  FOR INSERT WITH CHECK (
    is_event_organizer(event_id, auth.uid()) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Event organizers can update collaborators" ON event_collaborators
  FOR UPDATE USING (
    is_event_organizer(event_id, auth.uid()) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Event organizers can delete collaborators" ON event_collaborators
  FOR DELETE USING (
    is_event_organizer(event_id, auth.uid()) OR
    is_admin(auth.uid())
  );
