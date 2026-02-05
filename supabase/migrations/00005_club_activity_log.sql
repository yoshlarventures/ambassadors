-- Create club activity log table for tracking changes
CREATE TABLE club_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'ambassador_added', 'ambassador_removed'
  details JSONB DEFAULT '{}', -- Store what changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_club_activity_log_club ON club_activity_log(club_id);
CREATE INDEX idx_club_activity_log_created ON club_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE club_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view club activity logs" ON club_activity_log
  FOR SELECT USING (is_admin(auth.uid()));

-- System/admins can insert logs
CREATE POLICY "Admins can insert club activity logs" ON club_activity_log
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_regional_leader(auth.uid()));
