-- Add Exode LMS integration fields to users table
-- These fields are used to link user accounts with their Exode LMS accounts

-- Add exode_user_id column for account linking
ALTER TABLE users ADD COLUMN exode_user_id INTEGER;

-- Add timestamp for when the account was linked
ALTER TABLE users ADD COLUMN exode_linked_at TIMESTAMPTZ;

-- Create index for faster lookups by exode_user_id
CREATE INDEX idx_users_exode_user_id ON users(exode_user_id) WHERE exode_user_id IS NOT NULL;
