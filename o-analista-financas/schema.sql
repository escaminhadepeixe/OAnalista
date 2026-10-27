-- ============================================================
--  Finanças Diretas — Database Schema
--  Compatível com PostgreSQL / Supabase
--  Execute no SQL Editor do Supabase
-- ============================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Usuários ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT,
  cpf        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Compras ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT        NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  product_id TEXT        NOT NULL CHECK (product_id IN ('financas','cripto')),
  payment_id TEXT,
  status     TEXT        DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','cancelled','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Magic Links (acesso one-time) ─────────────────────────
CREATE TABLE IF NOT EXISTS magic_links (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT        UNIQUE NOT NULL,
  email      TEXT        NOT NULL,
  produto    TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  cpf_formatado TEXT,
  used          BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sessões ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT        UNIQUE NOT NULL,
  email      TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  recovery_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_purchases_email   ON purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_purchases_status  ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_sessions_token    ON sessions(token);

-- ── Limpeza de registros expirados (agende via pg_cron) ───
CREATE OR REPLACE FUNCTION cleanup_expired() RETURNS void AS $$
BEGIN
  DELETE FROM magic_links WHERE expires_at < NOW() - INTERVAL '7 days';
  DELETE FROM sessions    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ── Atualização (rode se o banco já existia) ─────────────────────────────
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ;
