-- ============================================================
-- AI Finance Assistant – Initial Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number  TEXT NOT NULL UNIQUE,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL UNIQUE,
  icon  TEXT,
  color TEXT
);

-- Seed default categories
INSERT INTO categories (name, icon, color) VALUES
  ('Food',          '🍔', '#FF6B6B'),
  ('Transport',     '🚗', '#4ECDC4'),
  ('Shopping',      '🛍️',  '#45B7D1'),
  ('Entertainment', '🎬', '#96CEB4'),
  ('Health',        '💊', '#FFEAA7'),
  ('Utilities',     '⚡', '#DDA0DD'),
  ('Rent',          '🏠', '#98D8C8'),
  ('Salary',        '💰', '#77DD77'),
  ('Investment',    '📈', '#AEC6CF'),
  ('Other',         '📦', '#B0B0B0')
ON CONFLICT (name) DO NOTHING;

-- ── accounts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  balance    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency   TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer', 'loan', 'investment', 'subscription')),
  amount           NUMERIC(12, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'INR',
  merchant         TEXT,
  category_id      UUID REFERENCES categories(id),
  payment_method   TEXT,
  notes            TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ  -- soft delete
);

-- ── conversation_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  source       TEXT NOT NULL DEFAULT 'whatsapp',
  sender       TEXT NOT NULL,
  raw_message  TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  parsed_json  JSONB,
  status       TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── budgets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  limit_amount NUMERIC(12, 2) NOT NULL,
  month       TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── loans ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrower    TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'settled')),
  due_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── attachments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'receipt', 'other')),
  url            TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_sender ON conversation_logs(sender);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month       ON budgets(user_id, month);
