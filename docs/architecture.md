# PhishGuard — System Architecture

## Overview

PhishGuard is a full-stack threat intelligence platform built on a monorepo with a clear
separation between the React frontend, Express API server, shared libraries, and the
PostgreSQL database. All packages are TypeScript-strict and verified by the root typecheck
pipeline on every change.

---

## Monorepo Layout

```
workspace/
├── artifacts/
│   ├── api-server/          # Express 5 REST API (port 8080)
│   └── phishing-detector/   # React + Vite SPA  (port auto-assigned)
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 contract + Orval codegen config
│   ├── api-client-react/    # Generated React Query hooks (do not hand-edit)
│   ├── api-zod/             # Generated Zod schemas  (do not hand-edit)
│   └── db/                  # Drizzle ORM schema + client
├── scripts/                 # Utility scripts
├── docs/                    # Architecture & API documentation (this folder)
├── pnpm-workspace.yaml      # Catalog pins, workspace discovery
├── tsconfig.base.json       # Shared strict TypeScript defaults
└── .env.example             # Environment variable reference
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                               │
│                  React + Vite SPA (phishing-detector)               │
│                                                                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Landing   │  │  URL Scanner │  │  Email   │  │  Dashboard  │  │
│  │  Page      │  │  Page        │  │  Analyzer│  │  + History  │  │
│  └────────────┘  └──────────────┘  └──────────┘  └─────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React Query (generated hooks from api-client-react)        │   │
│  │  custom-fetch.ts  →  auto-injects Bearer token              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / Replit reverse proxy
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPRESS 5 API SERVER  /api                       │
│                                                                     │
│  Middleware chain (app.ts):                                         │
│    pino-http → Helmet → CORS → express-rate-limit → JSON parser     │
│    → router → 404 handler → centralised error handler              │
│                                                                     │
│  Routes:                                                            │
│  ┌──────────────┬────────────────────┬────────────────────────┐    │
│  │ /auth/*      │ /scan/*            │ /admin/*               │    │
│  │ register     │ POST url           │ GET users              │    │
│  │ login        │ POST email         │ GET reports            │    │
│  │ profile      │ GET history        │ GET analytics          │    │
│  └──────────────┴────────────────────┴────────────────────────┘    │
│                   │                                                 │
│  ┌────────────────▼──────────────────────────────────────────────┐ │
│  │                   DETECTION ENGINE                            │ │
│  │                                                               │ │
│  │  analyzeUrl()  ──────────┬──────────────────────────────────▶│ │
│  │  14 independent checks:  │                                   │ │
│  │   HTTPS, IP, length,     │  checkUrlVirusTotal()             │ │
│  │   shortener, blacklist,  │  checkUrlSafeBrowsing()           │ │
│  │   TLD, subdomain depth,  │  (parallel, graceful fallback)    │ │
│  │   brand impersonation,   │                                   │ │
│  │   @-symbol, punycode,    │  Scores merged via               │ │
│  │   hyphens, keywords      │  riskCalculator.mergeScores()     │ │
│  │                          │                                   │ │
│  │  analyzeEmail() ─────────┘                                   │ │
│  │  Keyword, pattern, link, urgency, sender analysis            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                   │                                                 │
│  ┌────────────────▼──────────────────────────────────────────────┐ │
│  │               DRIZZLE ORM  →  PostgreSQL                      │ │
│  │               users | scan_history tables                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌─────────────────────┐      ┌─────────────────────────┐
   │  VirusTotal API      │      │  Google Safe Browsing   │
   │  (optional key)      │      │  API (optional key)     │
   └─────────────────────┘      └─────────────────────────┘
```

---

## Data Flow

### URL Scan Request

```
1. User pastes URL → React form (scan.tsx)
2. useScanUrl() hook fires POST /api/scan/url with Bearer token
3. API: ScanUrlBody Zod schema validates input
4. Three tasks run in parallel:
     a. analyzeUrl(url)        — local engine (14 checks, ~0ms)
     b. checkUrlVirusTotal(url) — VT API or { skipped: true }
     c. checkUrlSafeBrowsing(url) — GSB API or { safe: true }
5. Scores merged: rawScore = local + vt + gsb, clamped to 100
6. Risk level assigned: 0-30 SAFE | 31-60 SUSPICIOUS | 61-100 HIGH RISK
7. Scan record inserted into scan_history
8. Full ScanResult JSON returned to client
9. React Query invalidates dashboard cache → stats refresh live
```

### Email Scan Request

```
1. User pastes email content + optional subject/sender
2. POST /api/scan/email with Bearer token
3. ScanEmailBody Zod validation
4. analyzeEmail(content, subject, sender) — pure local analysis
     • keyword matching (32 phishing phrases)
     • regex pattern matching (8 patterns)
     • URL extraction & HTTP link count
     • sensitive data pattern detection
     • sender domain mismatch check
     • urgency language detection
5. Record inserted, ScanResult returned
```

### Authentication Flow

```
1. Register: POST /api/auth/register
     → bcrypt.hash(password, 12)
     → INSERT INTO users
     → signToken({ userId, email, role })  [JWT, 7-day expiry]
     → Return { token, user }

2. Login: POST /api/auth/login
     → SELECT user by email
     → bcrypt.compare(password, hash)
     → signToken(...)
     → Return { token, user }

3. Authenticated requests:
     → custom-fetch.ts reads localStorage["phishing_token"]
     → Attaches Authorization: Bearer <token>
     → requireAuth middleware: jwt.verify(token, JWT_SECRET)
     → req.user = { userId, email, role }

4. Admin-only requests:
     → requireAdmin middleware checks req.user.role === "admin"
     → 403 if not admin
```

---

## OpenAPI Contract-First Workflow

```
lib/api-spec/openapi.yaml   ← single source of truth
          │
          ▼
  pnpm --filter @workspace/api-spec run codegen
          │
          ├── lib/api-client-react/src/generated/api.ts
          │    └── React Query hooks (useAdminGetAnalytics, useScanUrl, …)
          │
          └── lib/api-zod/src/generated/api.zod.ts
               └── Zod schemas (ScanUrlBody, RegisterBody, …)
                    └── Used by API server to validate inputs
```

Any API change must start with editing `openapi.yaml`, then running codegen. This guarantees
the frontend types, backend validation schemas, and the spec all stay in sync.

---

## Risk Scoring Architecture

```
┌──────────────────────────────────────────────────────┐
│               URL RISK CHECKS  (additive)            │
├──────────────────────────────────────────────────────┤
│ Check                    │ Max Score │ Description   │
├──────────────────────────┼───────────┼───────────────┤
│ Non-HTTPS                │    +25    │ Unencrypted   │
│ Raw IP address           │    +30    │ No domain     │
│ URL length >200          │    +15    │ Obscures path │
│ URL length >100          │     +8    │ Suspicious    │
│ URL shortener            │    +20    │ Hidden dest.  │
│ Blacklisted domain       │    +90    │ Known phish   │
│ High-risk TLD            │    +20    │ 23 TLDs       │
│ Subdomain depth >4       │    +15    │ Evasion       │
│ Subdomain depth >3       │     +8    │ Warning       │
│ Suspicious keywords      │  up to 28 │ 32 keywords   │
│ Brand impersonation      │    +40    │ 15 brands     │
│ @ symbol in URL          │    +25    │ Hides domain  │
│ Double-slash in path     │    +10    │ Redirect      │
│ Punycode / non-ASCII     │    +30    │ Homograph     │
│ Hyphens ≥4               │    +15    │ Typosquatting │
│ Hyphens ≥2               │     +7    │ Warning       │
│ Long domain segment      │    +12    │ >30 chars     │
├──────────────────────────┼───────────┼───────────────┤
│ VirusTotal integration   │  up to 40 │ 70+ engines   │
│ Google Safe Browsing     │  up to 50 │ Threat DB     │
├──────────────────────────┴───────────┴───────────────┤
│ Final = clamp(sum, 0, 100)                           │
│  0–30  →  SAFE        31–60  →  SUSPICIOUS          │
│  61–100 → HIGH RISK                                  │
└──────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
Replit Deployments (production)
         │
         ▼
  Replit reverse proxy  (TLS termination)
         │
    /api ──────▶  api-server container  (Node 24, esbuild CJS bundle)
    /    ──────▶  phishing-detector     (Vite static build, served by Express static)
         │
         ▼
  PostgreSQL (Replit managed DB)
```

The shared reverse proxy routes by path prefix, longest-match first:
- `/api/*` → `api-server` (port 8080)
- `/*`     → `phishing-detector` (static)

No CORS configuration is needed between the SPA and the API in production because they
share the same domain. CORS headers are permissive only in development.
