-- Add attendance_rate column to sessions table
-- This stores the calculated attendance rate at the time of confirmation
-- so it won't change when new members join later

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5, 2) DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN sessions.attendance_rate IS 'Attendance rate (0-100) calculated at confirmation time. Null for unconfirmed sessions.';
