-- ============================================================
-- Add email for Email/Password authentication
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
