-- Add Exode course points column to users table
-- This stores the user's points/score from the Exode LMS course

-- Add exode_course_points column
ALTER TABLE users ADD COLUMN exode_course_points INTEGER DEFAULT 0;

-- Add timestamp for when the points were last synced
ALTER TABLE users ADD COLUMN exode_points_synced_at TIMESTAMPTZ;

-- Create index for leaderboard queries
CREATE INDEX idx_users_exode_course_points ON users(exode_course_points DESC) WHERE exode_course_points > 0;
