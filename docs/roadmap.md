# PhishGuard — Development Roadmap

## Project Status

| Phase | Name | Status |
|-------|------|--------|
| Phase 1 | Planning & Architecture | ✅ Complete |
| Phase 2 | Core Backend + Frontend | ✅ Complete |
| Phase 3 | Backend Enhancements | ✅ Complete |
| Phase 4 | AI Expansion | Planned |
| Phase 5 | Production Hardening | Planned |

---

## Phase 1 — Planning & Architecture (Complete)

**Goal:** Establish a production-quality foundation.

| Task | Status |
|------|--------|
| Monorepo with pnpm workspaces | ✅ |
| TypeScript strict mode across all packages | ✅ |
| OpenAPI contract-first API design | ✅ |
| Orval codegen (hooks + Zod schemas) | ✅ |
| Drizzle ORM + PostgreSQL schema | ✅ |
| Environment variable structure | ✅ |
| Reverse proxy routing architecture | ✅ |
| Security architecture design | ✅ |
| Database schema + migration SQL | ✅ |
| Architecture documentation | ✅ |

---

## Phase 2 — Core Backend + Frontend (Complete)

**Goal:** Full working application with all user-facing features.

| Day | Tasks |
|-----|-------|
| 1–2 | Express 5 server setup, Helmet, CORS, rate limiting, pino logging |
| 3–4 | Drizzle schema, database client, seed script |
| 5–6 | Auth routes: register, login, profile; JWT + bcrypt |
| 7–8 | URL scan route + internal risk engine (initial version) |
| 9 | Email scan route + email analysis engine |
| 10 | Scan history route with pagination and type filtering |
| 11 | Dashboard stats, recent scans, risk breakdown routes |
| 12–13 | React frontend: routing (Wouter), layout, auth context |
| 14 | Landing page with animated hero |
| 15 | URL scanner page with result card |
| 16 | Email analyzer page |
| 17 | Dashboard with Recharts pie chart + stat cards |
| 18 | Scan history page with filter controls |
| 19 | Admin console: users tab + reports tab |
| 20 | End-to-end testing, demo account seeding, deployment |

---

## Phase 3 — Backend Enhancements (Complete)

**Goal:** Production-grade risk engine, utilities, admin analytics.

| Task | Status |
|------|--------|
| VirusTotal API integration | ✅ |
| Google Safe Browsing API integration | ✅ |
| Threat intelligence constants layer | ✅ |
| Enhanced URL engine (14 checks) | ✅ |
| Enhanced email engine (urgency, sender checks) | ✅ |
| `asyncHandler` utility (removes try/catch boilerplate) | ✅ |
| `apiResponse` utility (typed sendSuccess/sendError) | ✅ |
| `riskCalculator` utility (clamp, merge, level mapping) | ✅ |
| `GET /api/admin/analytics` endpoint | ✅ |
| Admin console analytics tab (charts + top threats) | ✅ |
| Centralised error handler middleware | ✅ |
| `.env.example` documentation | ✅ |
| `lib/db/migrations/001_initial_schema.sql` | ✅ |
| Architecture + API + database + security docs | ✅ |

---

## Phase 4 — AI Expansion (Planned)

**Goal:** Integrate LLMs to add natural-language explanations and context.

### Week 1 — AI Explanation Layer

| Day | Tasks |
|-----|-------|
| 1–2 | Integrate OpenAI / Anthropic via Replit AI proxy |
| 3 | `explainUrl(url, findings)` — generate plain-English threat summary |
| 4 | `explainEmail(content, findings)` — AI verdict with reasoning |
| 5 | `scan_explanations` table + API endpoint `GET /api/scan/:id/explain` |
| 6–7 | Frontend: "AI Explain" button on result cards, streaming response |

### Week 2 — Intelligent Features

| Day | Tasks |
|-----|-------|
| 8–9 | Domain reputation scoring (WHOIS age, registrar, ASN) |
| 10 | Screenshot capture service for URLs (Puppeteer / headless Chrome) |
| 11 | Visual similarity detection — compare screenshot to known brand pages |
| 12–13 | Watchlist feature: save domains to monitor |
| 14 | Alert system: notify users when a watched domain is scanned as high-risk |

### OpenAPI additions (Phase 4)

```yaml
POST /api/scan/url          # existing — add optional AI explanation flag
GET  /api/scan/{id}/explain # new — fetch AI explanation for a scan
POST /api/watchlist         # new — add domain to watchlist
GET  /api/watchlist         # new — list watched domains
DELETE /api/watchlist/{id}  # new — remove from watchlist
```

---

## Phase 5 — Production Hardening (Planned)

**Goal:** Enterprise-grade reliability, observability, and compliance.

| Task | Priority | Effort |
|------|----------|--------|
| Email verification on registration | High | 1 day |
| Brute-force login lockout (per-IP, per-email) | High | 1 day |
| Audit log table for admin actions | High | 1 day |
| OpenTelemetry tracing | Medium | 2 days |
| Metrics dashboard (Prometheus / Grafana) | Medium | 3 days |
| Two-factor authentication (TOTP) | Medium | 2 days |
| GDPR: account deletion + data export | Medium | 2 days |
| Webhook outbound alerts for high-risk scans | Low | 1 day |
| Team / organisation support (multi-tenant) | Low | 5 days |
| SOC 2 compliance documentation | Low | ongoing |

---

## Team Distribution (Reference)

For a 2-person team working on Phase 4:

**Engineer A — Backend / AI**
- AI explanation service
- Screenshot capture
- Domain WHOIS integration
- Watchlist API endpoints
- Database migrations

**Engineer B — Frontend / UX**
- AI explanation UI
- Watchlist management page
- Alert notification centre
- Loading state improvements
- Mobile responsiveness audit

Daily sync: 15-minute standup reviewing the day's OpenAPI spec changes before starting
implementation — both engineers must agree on the schema before any code is written.

---

## Definition of Done

A feature is complete when:
1. OpenAPI spec is updated and codegen passes
2. Backend route is implemented with Zod validation + asyncHandler
3. Frontend hook is using the generated React Query hook
4. `pnpm run typecheck` passes with zero errors
5. The feature is manually tested end-to-end in the Replit preview
6. Documentation is updated (this file + `api.md` if new endpoints)
