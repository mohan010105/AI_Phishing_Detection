# PhishGuard — AI Phishing Detection Platform

A production-ready cybersecurity platform for detecting phishing URLs and malicious emails using risk scoring, pattern analysis, and real-time threat intelligence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/phishing-detector run dev` — run the frontend (port 22772)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Accounts

- **Demo user**: `demo@phishguard.io` / `Demo1234!`
- **Admin**: `admin@phishguard.io` / `Demo1234!`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, React Hook Form, Recharts, Wouter
- API: Express 5 + Helmet + express-rate-limit
- Auth: JWT via jsonwebtoken, bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — Drizzle table definitions (users, scan_history)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, scan, dashboard, admin)
- `artifacts/api-server/src/services/riskDetection.ts` — URL/email risk scoring engine
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/api-server/src/seed.ts` — Demo account seeder (`pnpm --filter @workspace/api-server run seed`)
- `artifacts/phishing-detector/src/` — React frontend
- `artifacts/phishing-detector/src/pages/profile.tsx` — Profile + password change
- `artifacts/phishing-detector/src/pages/settings.tsx` — User preferences (localStorage)
- `artifacts/phishing-detector/src/pages/reports.tsx` — Filtered report table with CSV/JSON export

## Architecture decisions

- JWT stored in localStorage under `phishing_token`; auto-injected into every API call via the custom-fetch layer in `lib/api-client-react/src/custom-fetch.ts`
- Risk scoring is entirely server-side — no ML dependency, uses deterministic pattern/keyword analysis
- Risk levels: 0–30 = SAFE, 31–60 = SUSPICIOUS, 61–100 = HIGH RISK
- Rate limiting: 200 req/15min globally, 30 req/min for `/api/scan/*`
- Admin routes require `role = "admin"` in JWT payload

## Product

- Landing page with animated hero and feature highlights
- Register/Login with JWT session management
- URL Scanner: paste a URL, get a risk score with detailed findings
- Email Analyzer: paste email content + optional subject/sender, get phishing verdict
- Dashboard: stats cards, risk breakdown pie chart, recent scan activity
- Scan History: paginated table with type/risk level filtering
- Reports: filterable table with CSV and JSON export
- Profile: view account info, update display name, change password
- Settings: notification preferences, display options, session management — persisted in localStorage
- Admin: user list and all-platform scan reports with risk filtering

## Gotchas

- Always run `pnpm run typecheck:libs` after changing schema in `lib/db/` before typechecking the API server
- After any OpenAPI spec change, run codegen before building routes
- The `bcryptjs` package is in `artifacts/api-server` dependencies, not workspace root
