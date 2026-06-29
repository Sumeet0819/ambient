-- ============================================================
-- Add link_code for WhatsApp account linking
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS link_code TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
