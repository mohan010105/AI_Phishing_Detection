-- =============================================================
-- PhishGuard — Initial Database Schema
-- Run once on a fresh PostgreSQL database
-- For Replit: use `pnpm --filter @workspace/db run push` instead
-- =============================================================

-- ----------------------------------------------------------------
-- ENUMs
-- ----------------------------------------------------------------
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE scan_type AS ENUM ('url', 'email');
CREATE TYPE risk_level AS ENUM ('safe', 'suspicious', 'high_risk');

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  email        TEXT        NOT NULL UNIQUE,
  name         TEXT        NOT NULL,
  password_hash TEXT       NOT NULL,
  role         role        NOT NULL DEFAULT 'user',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ----------------------------------------------------------------
-- scan_history
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_history (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  type       scan_type   NOT NULL,
  target     TEXT        NOT NULL,
  risk_score INTEGER     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level risk_level  NOT NULL,
  findings   TEXT[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_id    ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_risk_level ON scan_history(risk_level);
CREATE INDEX IF NOT EXISTS idx_scan_history_type       ON scan_history(type);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);

-- ----------------------------------------------------------------
-- Seed: demo accounts (passwords hashed with bcrypt, cost=12)
-- Both passwords are: Demo1234!
-- ----------------------------------------------------------------
INSERT INTO users (email, name, password_hash, role) VALUES
  (
    'demo@phishguard.io',
    'Demo User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGiIkpMsYk3Q/n.GgEGiJbFdFMe',
    'user'
  ),
  (
    'admin@phishguard.io',
    'Admin User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGiIkpMsYk3Q/n.GgEGiJbFdFMe',
    'admin'
  )
ON CONFLICT (email) DO NOTHING;
