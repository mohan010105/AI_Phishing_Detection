# PhishGuard — Deployment & Operations Guide

This guide describes the step-by-step procedure required to deploy, configure, and maintain the **PhishGuard** application stack in production.

---

## 1. System Architecture Deployment Map

```
  ┌────────────────────────────────────────────────────────┐
  │                      Web Client                        │
  │                   (Hosted on Vercel)                   │
  └──────────────────────────┬─────────────────────────────┘
                             │ HTTPS API Requests
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   API Node.js Server                   │
  │            (Hosted on Render / AWS EC2)                │
  └──────────────┬───────────────────────────┬─────────────┘
                 │ PostgreSQL Dialect        │ AI & Threat APIs
                 ▼                           ▼
  ┌──────────────────────────┐   ┌─────────────────────────┐
  │   Supabase Postgres DB   │   │ VirusTotal, Google SB,   │
  │     (Cloud Database)     │   │ OpenAI, Gemini APIs     │
  └──────────────────────────┘   └─────────────────────────┘
```

---

## 2. Supabase Setup Guide

PhishGuard utilizes **Supabase** (PostgreSQL) for transactional database operations and persistence. Follow these instructions to initialize your cloud database instance:

1. **Create a Supabase Project**:
   - Go to [Supabase Console](https://supabase.com) and click **New Project**.
   - Select your Organization, name the project (e.g., `PhishGuard-DB`), select a region, and choose a secure database password.
   - Wait for the database instance to provision.

2. **Retrieve Connection Strings**:
   - Navigate to **Project Settings** -> **Database**.
   - Under **Connection Strings**, select **URI** and copy the string (e.g., `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`).
   - Substitute your actual database password in place of `[YOUR-PASSWORD]`.

3. **Initialize Database Schemas**:
   - Drizzle ORM compiles migrations automatically, or you can run migrations from the workspace terminal directly:
     ```bash
     pnpm --filter "@workspace/db" db:push
     ```
   - Alternatively, navigate to Supabase **SQL Editor**, paste the SQL table definitions from your schemas, and execute the queries.

---

## 3. API Server Deployment Guide (e.g., Render or AWS)

The backend is built as a robust Express application. To deploy it to a platform like Render:

1. **Create a Web Service**:
   - Connect your GitHub repository to your host account.
   - Select the `PhishGuard` project workspace.

2. **Configure Build Settings**:
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm --filter "@workspace/api-server" run start` or `node artifacts/api-server/dist/index.mjs`

3. **Configure Environment Variables**:
   - Set the variables exactly as documented in the variables checklist (see Section 5).

---

## 4. Web Client Deployment Guide (Vercel)

The frontend is a modern SPA powered by Vite. To deploy it to Vercel:

1. **Create Vercel Project**:
   - Import your PhishGuard repository into your Vercel Dashboard.

2. **Set Monorepo Root**:
   - Set the **Root Directory** setting to `artifacts/phishing-detector`.
   - Set the Framework Preset to **Vite**.

3. **Build & Output Settings**:
   - **Build Command**: `vite build --config vite.config.ts`
   - **Output Directory**: `dist/public`

4. **Environment Variables**:
   - Set `VITE_API_URL` to point to the base URL of your deployed Express backend (e.g., `https://phishguard-api.onrender.com`).

---

## 5. Complete Environment Variables Checklist

Ensure these variables are configured correctly in the environment configuration (`.env` or dashboard variables):

| Variable Name | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Running environment mode (`development` or `production`) |
| `PORT` | Yes | `8080` | Network port for backend binding |
| `DATABASE_URL` | Yes | `postgresql://postgres:pass@db.syir.supabase.co:5432/postgres` | Fully qualified PostgreSQL connection URI |
| `JWT_SECRET` | Yes | `a-64-character-random-hexadecimal-string` | Symmetric secret key for signing JWTs |
| `VIRUSTOTAL_API_KEY`| Yes | `05917ba2e5abb1a1b601493...` | Developer API key for VirusTotal domain scan feeds |
| `GOOGLE_SAFE_BROWSING_API_KEY`| Yes | `AIzaSyCUx8eIb8sUIfZmqV5...` | Web threat API key for Google Safe Browsing requests |
| `ABUSEIPDB_API_KEY`| Yes | `7031aee0abd9263141a01e...` | Threat intelligence key for server IP reputation checks |
| `OPENAI_API_KEY` | Yes | `sk-proj-l2YX3-52r1RbQ8...` | API key for OpenAI model access |
| `GEMINI_API_KEY` | Yes | `AIzaSyD-GeminiFallback...` | API key for Gemini models fallback (OpenAI compatible) |

---

## 6. Production Launch Checklist

Before declaring the deployment finalized, check these items:

- [ ] **HTTPS Enforced**: Check that SSL/TLS is active across both the frontend and backend.
- [ ] **Secrets Rotated**: Ensure `JWT_SECRET` has been rotated away from default development hashes to a cryptographically strong string.
- [ ] **Database Connection Pool**: Ensure connection pool thresholds match typical traffic counts on Supabase.
- [ ] **Rate Limiting**: Check that API rate limits are enabled on Express endpoints to prevent brute-force attacks.
- [ ] **Error Masks**: Verify that `NODE_ENV` is set to `production` so Express does not return stack traces in API error responses.

---

## 7. Troubleshooting & Operational Guide

### 7.1. Backend Fails to Start with Database Error
- **Symptom**: `Failed to connect to postgresql...` or timeout logs.
- **Cause**: Supabase database paused, password contains unescaped special characters, or network security rules block connections.
- **Resolution**:
  - Verify that the Supabase project is active (Supabase pauses free projects after periods of inactivity).
  - URL-encode any special characters in the PostgreSQL password string before updating `DATABASE_URL`.
  - Let PhishGuard run in in-memory Mock mode if connection is temporarily unavailable to prevent complete client downtime.

### 7.2. "Invalid time value" Chart Overlay Error
- **Symptom**: The chart component crashes the frontend layout.
- **Cause**: The API returns dates in inconsistent shapes, or dates are processed incorrectly.
- **Resolution**: Ensure the frontend has our latest `safeFormatDate` helper implemented in `admin.tsx` and `dashboard.tsx` to handle bad inputs without crashing.

### 7.3. "OPENAI_AUTH_FAILED" Chat Alert
- **Symptom**: AI companion chat returns `⚠️ AI services unavailable` toast.
- **Cause**: The OpenAI key in `.env` is expired, has exceeded quotas, or has incorrect permissions.
- **Resolution**:
  - Update `OPENAI_API_KEY` in settings.
  - Verify that the system's dual-provider fallback to `GEMINI_API_KEY` is fully configured so the application can switch over transparently.
