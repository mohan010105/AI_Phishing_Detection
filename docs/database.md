# PhishGuard — Database Schema

PostgreSQL managed by **Drizzle ORM**. Schema lives in `lib/db/src/schema/`.

A raw SQL version for manual setup is at `lib/db/migrations/001_initial_schema.sql`.
For Replit development, use `pnpm --filter @workspace/db run push` instead.

---

## Tables

### `users`

Stores registered accounts.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `serial` (PK) | no | auto | |
| `email` | `text` | no | — | UNIQUE |
| `name` | `text` | no | — | |
| `password_hash` | `text` | no | — | bcrypt, cost=12 |
| `role` | `text` | no | `'user'` | `'user'` \| `'admin'` |
| `created_at` | `timestamp` | no | `now()` | UTC |

**Indexes**
- `PRIMARY KEY (id)`
- `UNIQUE (email)` — enforces one account per address
- `INDEX (role)` — admin queries filter by role

**Drizzle definition** — `lib/db/src/schema/users.ts`

---

### `scan_history`

Every URL and email scan result.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `serial` (PK) | no | auto | |
| `user_id` | `integer` (FK) | yes | `NULL` | → `users.id` ON DELETE SET NULL |
| `type` | `text` | no | — | `'url'` \| `'email'` |
| `target` | `text` | no | — | URL string or email label |
| `risk_score` | `integer` | no | — | 0–100 |
| `risk_level` | `text` | no | — | `'safe'` \| `'suspicious'` \| `'high_risk'` |
| `findings` | `text[]` | no | `'{}'` | Human-readable findings list |
| `created_at` | `timestamp` | no | `now()` | UTC |

**Indexes**
- `PRIMARY KEY (id)`
- `INDEX (user_id)` — per-user history queries
- `INDEX (risk_level)` — filtering by risk in admin reports
- `INDEX (type)` — filtering URL-only or email-only
- `INDEX (created_at DESC)` — chronological ordering

**Relationships**
- `user_id → users.id` — nullable FK; scans are not deleted when a user is deleted
  (the record is retained for audit purposes, `user_id` becomes `NULL`)

**Drizzle definition** — `lib/db/src/schema/scanHistory.ts`

---

## Entity-Relationship Diagram

```
┌──────────────────────┐         ┌────────────────────────────────┐
│       users          │         │         scan_history           │
├──────────────────────┤         ├────────────────────────────────┤
│ id          PK       │◀────────│ user_id   FK (nullable)        │
│ email       UNIQUE   │  0..*   │ id        PK                   │
│ name                 │         │ type      url | email          │
│ password_hash        │         │ target                         │
│ role        user|adm │         │ risk_score  0-100              │
│ created_at           │         │ risk_level  safe|susp|high     │
└──────────────────────┘         │ findings    text[]             │
                                 │ created_at                     │
                                 └────────────────────────────────┘
```

---

## Common Queries

### User's scan history (paginated)
```sql
SELECT * FROM scan_history
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### Dashboard stats for a user
```sql
SELECT
  COUNT(*)                                      AS total_scans,
  COUNT(*) FILTER (WHERE type = 'url')          AS url_scans,
  COUNT(*) FILTER (WHERE type = 'email')        AS email_scans,
  COUNT(*) FILTER (WHERE risk_level = 'high_risk')  AS high_risk,
  COUNT(*) FILTER (WHERE risk_level = 'suspicious') AS suspicious,
  COUNT(*) FILTER (WHERE risk_level = 'safe')       AS safe,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS this_week
FROM scan_history
WHERE user_id = $1;
```

### 30-day daily activity (admin analytics)
```sql
SELECT
  TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
  COUNT(*) AS count
FROM scan_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY created_at::date
ORDER BY created_at::date ASC;
```

### Top threats (admin analytics)
```sql
SELECT * FROM scan_history
WHERE risk_level = 'high_risk'
ORDER BY risk_score DESC
LIMIT 10;
```

---

## Migrations

The project uses **Drizzle Kit** for schema management.

```bash
# Push schema to dev database (destructive-free for additive changes)
pnpm --filter @workspace/db run push

# After any schema change, regenerate types for dependent packages
pnpm run typecheck:libs
```

For production, apply `lib/db/migrations/001_initial_schema.sql` once on a fresh database,
then use Drizzle Kit migrations for subsequent changes.

---

## Future Schema Additions

The following tables are planned for Phase 4 (AI expansion):

```sql
-- Per-scan AI explanations
CREATE TABLE scan_explanations (
  id          SERIAL PRIMARY KEY,
  scan_id     INTEGER NOT NULL REFERENCES scan_history(id) ON DELETE CASCADE,
  model       TEXT NOT NULL,          -- e.g. 'gpt-4o'
  explanation TEXT NOT NULL,
  confidence  NUMERIC(4,3),           -- 0.000–1.000
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved threat watchlist
CREATE TABLE watchlist (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, domain)
);
```
