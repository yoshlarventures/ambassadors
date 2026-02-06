-- Add columns to store snapshot IDs for report data
-- This ensures we can always show the exact data that was counted when the report was created

ALTER TABLE reports ADD COLUMN session_ids UUID[] DEFAULT NULL;
ALTER TABLE reports ADD COLUMN event_ids UUID[] DEFAULT NULL;
ALTER TABLE reports ADD COLUMN member_ids UUID[] DEFAULT NULL;
ALTER TABLE reports ADD COLUMN point_ids UUID[] DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN reports.session_ids IS 'Array of session IDs included in this report';
COMMENT ON COLUMN reports.event_ids IS 'Array of event IDs included in this report';
COMMENT ON COLUMN reports.member_ids IS 'Array of new club_member IDs included in this report';
COMMENT ON COLUMN reports.point_ids IS 'Array of point record IDs included in this report';
