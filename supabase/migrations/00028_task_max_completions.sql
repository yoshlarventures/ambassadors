-- Add max_completions column to tasks table
ALTER TABLE tasks ADD COLUMN max_completions INTEGER DEFAULT 1;

-- Drop the existing unique constraint on task_completions to allow multiple completions
ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS task_completions_task_id_user_id_key;
