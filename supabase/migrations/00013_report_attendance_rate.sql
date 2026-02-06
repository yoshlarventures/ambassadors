-- Add attendance_rate column to reports table
-- This stores the average attendance percentage across all confirmed sessions for the month

ALTER TABLE reports ADD COLUMN attendance_rate NUMERIC(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN reports.attendance_rate IS 'Average attendance rate percentage across all confirmed sessions for the reporting month';
