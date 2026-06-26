-- Add pick_deadline to draft_sessions for server-side timeout
ALTER TABLE draft_sessions
ADD COLUMN IF NOT EXISTS pick_deadline TIMESTAMPTZ;
