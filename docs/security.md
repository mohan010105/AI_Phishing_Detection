# PhishGuard — Security Architecture

## Layers of Defence

```
Request
   │
   ▼
[1] TLS (Replit reverse proxy — all traffic encrypted)
   │
   ▼
[2] Helmet (secure HTTP headers)
   │
   ▼
[3] CORS (allow-list for development; same-origin in production)
   │
   ▼
[4] Rate Limiting
   │
   ▼
[5] JSON body parsing (size limit enforced by Express)
   │
   ▼
[6] Input validation (Zod schemas — generated from OpenAPI spec)
   │
   ▼
[7] JWT authentication middleware (requireAuth)
   │
   ▼
[8] Role authorisation middleware (requireAdmin)
   │
   ▼
[9] Drizzle ORM (parameterised queries — SQL injection impossible)
   │
   ▼
Response
```

---

## 1. Transport Security

All traffic in production is routed through Replit's TLS-terminating reverse proxy. The
Node.js server itself never handles TLS — it listens on `localhost` only, reachable
exclusively through the proxy.

---

## 2. HTTP Security Headers (Helmet)

Helmet sets the following headers on every response:

| Header | Value / Effect |
|--------|----------------|
| `Content-Security-Policy` | Restricts resource origins |
| `X-Content-Type-Options` | `nosniff` — prevents MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` — prevents clickjacking |
| `X-XSS-Protection` | Legacy XSS filter |
| `Strict-Transport-Security` | Enforces HTTPS in browsers |
| `Referrer-Policy` | Limits referrer leakage |

---

## 3. CORS

Configuration in `app.ts`:
- Development: accepts requests from any origin (Vite dev server may be on a different port)
- Production: same-origin only (frontend and API share the same domain via reverse proxy)

---

## 4. Rate Limiting

Two tiers managed by `express-rate-limit`:

| Scope | Limit | Window | Purpose |
|-------|-------|--------|---------|
| Global — all `/api` routes | 200 req | 15 min | Prevents general abuse |
| Scan — `/api/scan/*` | 30 req | 1 min | Prevents API-scraping the detection engine |

Returns `429 Too Many Requests` with a `Retry-After` header when exceeded.

---

## 5. Input Validation

Every request body is parsed through a **Zod schema generated from the OpenAPI spec**.
Validation happens before any business logic runs:

```typescript
const parsed = ScanUrlBody.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: "..." });
  return;
}
```

Benefits:
- No raw `req.body` access in business logic — always typed + validated
- Schema is a single source of truth shared between frontend (form validation) and backend
- Unknown fields are stripped automatically (Zod default behaviour)

---

## 6. Authentication — JWT

Tokens are signed with `jsonwebtoken` using `HS256` (HMAC-SHA256).

**Payload structure**
```typescript
{ userId: number; email: string; role: "user" | "admin" }
```

**Security properties**
- Expiry: 7 days (`expiresIn: "7d"`)
- Secret: `JWT_SECRET` environment variable — must be a random 64-byte hex string
- Stored in `localStorage["phishing_token"]` on the client
- Injected via `custom-fetch.ts` as `Authorization: Bearer <token>`

**Token verification** (`requireAuth` middleware)
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { userId, email, role }
```

If verification fails (invalid signature, expired, malformed) → `401 Unauthorized`.

---

## 7. Password Security

- Hashed with **bcryptjs**, cost factor **12** (approx. 250ms per hash on modern hardware)
- Raw passwords are never logged, stored, or returned in any response
- Timing-safe comparison via `bcrypt.compare` (prevents timing attacks)

---

## 8. Role-Based Access Control

Two roles: `user` (default) and `admin`.

```typescript
// requireAdmin middleware
if (req.user?.role !== "admin") {
  res.status(403).json({ error: "Admin access required" });
  return;
}
```

Admin role is assigned at registration time or manually in the database. There is no
self-service role elevation.

---

## 9. SQL Injection Prevention

All database queries use **Drizzle ORM's query builder**, which produces parameterised
queries. No string interpolation into SQL. Raw SQL is only used in the analytics
`TO_CHAR(created_at::date, 'YYYY-MM-DD')` expression, which contains no user input.

---

## 10. Error Handling

The centralised error handler (`middlewares/errorHandler.ts`) catches all unhandled
exceptions and returns a generic `500 Internal Server Error` response. Stack traces are
logged server-side (via `pino`) but **never** sent to the client.

```typescript
// What the client sees
{ "error": "Internal server error" }

// What the server logs
{ level: "error", err: { message, stack }, reqId: "..." }
```

---

## 11. Secrets Management

All secrets are managed as Replit environment variables:

| Variable | Purpose | Rotation |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Replit-managed |
| `JWT_SECRET` | Token signing | Manual — rotate to invalidate all sessions |
| `SESSION_SECRET` | Express session | Manual |
| `VIRUSTOTAL_API_KEY` | VT API | Annual (VirusTotal account) |
| `GOOGLE_SAFE_BROWSING_API_KEY` | GSB API | Annual (GCP) |

Secrets are never committed to version control. `.env.example` contains only placeholder
values. The production `DATABASE_URL` is injected automatically by Replit Deployments.

---

## 12. Logging Strategy

All request logging is handled by **pino-http** (structured JSON logs). Sensitive fields
are never logged:

- Passwords are filtered before reaching any middleware
- JWT tokens may appear in the `Authorization` header — pino-http is configured to redact
  the `req.headers.authorization` field
- Email addresses are logged only at the `debug` level (off in production)

---

## Future Security Additions (Phase 4)

- CSRF tokens for state-mutating requests (if cookies replace localStorage JWT)
- Brute-force lockout: track failed login attempts per IP, lock after 10 failures / 15 min
- Audit log table: record admin actions (user role changes, bulk deletes)
- Email verification on registration
- Two-factor authentication (TOTP)
