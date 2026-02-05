-- Event Activity Logs
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- created, approved, rejected, cancelled, confirmed, edited
  actor_id UUID NOT NULL REFERENCES users(id),
  details JSONB, -- additional details like rejection_reason, changes made, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_event_logs_event_id ON event_logs(event_id);
CREATE INDEX idx_event_logs_created_at ON event_logs(created_at DESC);

-- RLS Policies for event_logs
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs
CREATE POLICY "Admins can view all event logs" ON event_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Organizers and collaborators can see logs for their events
CREATE POLICY "Event organizers can view event logs" ON event_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_logs.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Event collaborators can view event logs" ON event_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_collaborators
      WHERE event_collaborators.event_id = event_logs.event_id
      AND event_collaborators.user_id = auth.uid()
    )
  );

-- Only authenticated users can insert logs (will be done via triggers or app)
CREATE POLICY "Authenticated users can insert event logs" ON event_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Remove 'draft' from event_status enum
-- First, update any existing draft events to pending_approval
UPDATE events SET status = 'pending_approval' WHERE status = 'draft';

-- Note: PostgreSQL doesn't support removing values from enums easily
-- The 'draft' value will remain in the enum but won't be used
-- This is a known PostgreSQL limitation

-- Add cancellation_reason column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
