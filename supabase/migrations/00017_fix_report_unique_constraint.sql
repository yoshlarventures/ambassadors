-- Fix the unique constraint on reports
-- Old: one report per club per month (wrong for multi-club ambassadors)
-- New: one report per ambassador per month

-- Drop the old constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_club_id_month_year_key;

-- Add the new constraint
ALTER TABLE reports ADD CONSTRAINT reports_ambassador_month_year_key UNIQUE (ambassador_id, month, year);
