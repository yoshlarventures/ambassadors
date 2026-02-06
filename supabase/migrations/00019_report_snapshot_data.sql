-- Store actual data snapshots instead of just IDs
-- This makes report data completely static/historical

-- Add JSONB columns for storing snapshot data
ALTER TABLE reports ADD COLUMN sessions_data JSONB DEFAULT NULL;
ALTER TABLE reports ADD COLUMN events_data JSONB DEFAULT NULL;
ALTER TABLE reports ADD COLUMN members_data JSONB DEFAULT NULL;
ALTER TABLE reports ADD COLUMN points_data JSONB DEFAULT NULL;

-- Comments
COMMENT ON COLUMN reports.sessions_data IS 'Snapshot of session data at report creation time';
COMMENT ON COLUMN reports.events_data IS 'Snapshot of event data at report creation time';
COMMENT ON COLUMN reports.members_data IS 'Snapshot of new member data at report creation time';
COMMENT ON COLUMN reports.points_data IS 'Snapshot of points data at report creation time';
