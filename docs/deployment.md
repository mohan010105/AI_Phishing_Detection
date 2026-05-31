# PhishGuard — Deployment Guide

## Overview

The project deploys as two services behind Replit's shared reverse proxy:

| Service | Path | Build output |
|---------|------|-------------|
| `api-server` | `/api` | esbuild CJS bundle (`dist/index.cjs`) |
| `phishing-detector` | `/` | Vite static build (`dist/`) |

---

## Pre-Deployment Checklist

```
[ ] All env vars set in Replit Secrets (see Environment Variables section)
[ ] pnpm run typecheck passes with zero errors
[ ] API server starts and /api/healthz returns { "status": "ok" }
[ ] Database schema is up to date (pnpm --filter @workspace/db run push)
[ ] Demo accounts exist (seeded via lib/db/src/seed.ts)
[ ] Both workflows running in the dev environment
```

---

## Environment Variables

Set these in **Replit Secrets** (not in `.env` files — those are for documentation only).

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string — auto-injected by Replit DB |
| `JWT_SECRET` | 64-byte random hex string for JWT signing |
| `SESSION_SECRET` | 64-byte random hex string for session signing |

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Optional (Threat Intelligence)

| Variable | Description | Fallback |
|----------|-------------|----------|
| `VIRUSTOTAL_API_KEY` | VirusTotal v3 API key | Internal engine only |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Google Cloud — Safe Browsing API | Internal engine only |

The platform is fully functional without these keys — the internal 14-check risk engine
runs regardless. External APIs add extra signal on top.

---

## Deploying on Replit

### One-click Deploy

1. Open the project in Replit
2. Click **Deploy** in the top bar
3. Select **Reserved VM** (recommended for an always-on API server)
4. Confirm environment variables are present in Secrets
5. Click **Deploy Now**

Replit Deployments will:
- Run `pnpm run build` to produce production bundles
- Start both services with the correct `PORT` and `NODE_ENV=production`
- Provision TLS and a `.replit.app` subdomain automatically
- Health-check the services before routing live traffic

### Deployment Build Commands

**api-server** (`artifacts/api-server/package.json`)
```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --format=cjs --outfile=dist/index.cjs",
    "start": "node dist/index.cjs"
  }
}
```

**phishing-detector** (`artifacts/phishing-detector/package.json`)
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Database in Production

The Replit-managed PostgreSQL database is shared between development and production unless
you create a separate production database. Recommended approach:

1. In development: use `pnpm --filter @workspace/db run push` for schema changes
2. Before deploying breaking schema changes: create a backup
3. After deploying: verify `/api/healthz` returns 200

To connect to the production database for read-only inspection:
```bash
psql $DATABASE_URL
```

---

## Reverse Proxy Routing

The `artifact.toml` files configure path routing:

**api-server** (`artifacts/api-server/.replit-artifact/artifact.toml`)
```toml
[[services]]
localPort = 8080
name = "API Server"
paths = ["/api"]
```

**phishing-detector** (`artifacts/phishing-detector/.replit-artifact/artifact.toml`)
```toml
[[services]]
localPort = <assigned>
name = "web"
paths = ["/"]
```

Path matching is longest-prefix first, so `/api` routes take priority over `/`.

---

## Custom Domain (Optional)

1. Go to the Deployment settings in Replit
2. Under **Custom Domain**, enter your domain (e.g. `phishguard.io`)
3. Add the CNAME record provided by Replit to your DNS provider
4. Replit provisions a TLS certificate automatically via Let's Encrypt

---

## Vercel Deployment (Alternative)

If deploying to Vercel instead of Replit:

**vercel.json** (place in project root)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api-server/$1" },
    { "source": "/(.*)", "destination": "/" }
  ],
  "functions": {
    "artifacts/api-server/src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

Note: Vercel's serverless functions have a cold-start penalty. The Express server requires
adaptation to a serverless handler wrapper (e.g. `@vercel/node`). Replit is the
recommended deployment target for this stack.

---

## Monitoring & Logs

Production logs are structured JSON (pino). Access them in Replit:
- Open the project
- Click **Deployment** → **Logs**
- Filter by `level: "error"` for issues

Key log patterns to watch:
```
"msg": "Server started"              — startup confirmation
"msg": "URL scan DB error"           — database write failure
"msg": "VirusTotal API error"        — VT key invalid or quota exceeded
"msg": "Safe Browsing API error"     — GSB key invalid or quota exceeded
```

---

## Rollback

Replit creates automatic checkpoints. To rollback:
1. Open **Version History** in the Replit editor
2. Select the checkpoint before the breaking change
3. Click **Restore**

For database rollbacks: restore from a pg_dump backup taken before the migration.
