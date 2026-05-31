# PhishGuard — API Reference

Base URL: `/api`
Authentication: `Authorization: Bearer <jwt_token>`
All responses are `application/json`.

---

## Health

### `GET /api/healthz`

Public. Returns server health status.

**Response 200**
```json
{ "status": "ok" }
```

---

## Auth

### `POST /api/auth/register`

Register a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "MinLength8!",
  "name": "Jane Smith"
}
```

**Validation rules**
- `email` — valid email format, unique across users
- `password` — minimum 8 characters
- `name` — minimum 2 characters

**Response 201**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jane Smith",
    "role": "user",
    "createdAt": "2026-05-22T10:00:00.000Z"
  }
}
```

**Errors**
| Status | Error |
|--------|-------|
| 400 | Validation error — email/password/name failed validation |
| 409 | An account with this email already exists |

---

### `POST /api/auth/login`

Authenticate and receive a JWT.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "MinLength8!"
}
```

**Response 200**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jane Smith",
    "role": "user",
    "createdAt": "2026-05-22T10:00:00.000Z"
  }
}
```

**Errors**
| Status | Error |
|--------|-------|
| 400 | Email and password are required |
| 401 | Invalid email or password |

---

### `GET /api/auth/profile`

Requires auth. Returns the authenticated user's profile.

**Response 200**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Jane Smith",
  "role": "user",
  "createdAt": "2026-05-22T10:00:00.000Z"
}
```

**Errors**
| Status | Error |
|--------|-------|
| 401 | Missing or invalid token |
| 404 | User not found |

---

## Scan

### `POST /api/scan/url`

Requires auth. Analyze a URL for phishing indicators.

**Request body**
```json
{
  "url": "https://suspicious-login.xyz/paypal/verify"
}
```

**Processing**
Three checks run in parallel:
1. Internal engine — 14 deterministic checks
2. VirusTotal API — 70+ antivirus engines (skipped if no API key)
3. Google Safe Browsing API — Google threat database (skipped if no API key)

Scores are merged and clamped to 0–100.

**Response 200**
```json
{
  "id": 42,
  "type": "url",
  "target": "https://suspicious-login.xyz/paypal/verify",
  "riskScore": 87,
  "riskLevel": "high_risk",
  "findings": [
    "Brand impersonation detected: \"paypal\" referenced but domain is not paypal.com",
    "High-risk top-level domain detected (.xyz) — frequently abused for phishing",
    "Contains 2 suspicious keyword(s): login, verify",
    "Unusually long URL (47 characters) — may be obscuring destination"
  ],
  "userId": 1,
  "createdAt": "2026-05-22T10:05:00.000Z"
}
```

**Risk levels**
| Score | Level |
|-------|-------|
| 0–30 | `safe` |
| 31–60 | `suspicious` |
| 61–100 | `high_risk` |

**Errors**
| Status | Error |
|--------|-------|
| 400 | Invalid URL provided |
| 401 | Missing or invalid token |

---

### `POST /api/scan/email`

Requires auth. Analyze email content for phishing indicators.

**Request body**
```json
{
  "content": "Dear customer, your account has been suspended. Click here to verify...",
  "subject": "Urgent: Account Suspended",
  "sender": "security@paypal-alerts.com"
}
```

Fields `subject` and `sender` are optional but improve accuracy.

**Response 200**
```json
{
  "id": 43,
  "type": "email",
  "target": "Email: Urgent: Account Suspended",
  "riskScore": 72,
  "riskLevel": "high_risk",
  "findings": [
    "Contains 4 phishing trigger phrase(s): \"your account has been\", \"suspended\", \"verify\", \"dear customer\"",
    "Sender address references a brand but does not match its official domain",
    "Creates false urgency — common psychological manipulation tactic in phishing"
  ],
  "userId": 1,
  "createdAt": "2026-05-22T10:06:00.000Z"
}
```

**Errors**
| Status | Error |
|--------|-------|
| 400 | Invalid input — content minimum 10 characters |
| 401 | Missing or invalid token |

---

### `GET /api/scan/history`

Requires auth. Paginated scan history for the authenticated user.

**Query parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |
| `type` | `url` \| `email` | — | Filter by scan type |

**Response 200**
```json
{
  "scans": [
    {
      "id": 43,
      "type": "email",
      "target": "Email: Urgent: Account Suspended",
      "riskScore": 72,
      "riskLevel": "high_risk",
      "findings": ["..."],
      "userId": 1,
      "createdAt": "2026-05-22T10:06:00.000Z"
    }
  ],
  "total": 58,
  "page": 1,
  "limit": 20
}
```

---

## Dashboard

### `GET /api/dashboard/stats`

Requires auth. Aggregate statistics for the authenticated user.

**Response 200**
```json
{
  "totalScans": 58,
  "urlScans": 30,
  "emailScans": 28,
  "highRiskCount": 12,
  "suspiciousCount": 20,
  "safeCount": 26,
  "scansThisWeek": 8
}
```

---

### `GET /api/dashboard/recent`

Requires auth. Most recent scans for the dashboard feed.

**Query parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 5 | Max results |

**Response 200** — array of `ScanResult` objects (see scan history above)

---

### `GET /api/dashboard/risk-breakdown`

Requires auth. Count of scans per risk level for chart rendering.

**Response 200**
```json
{
  "safe": 26,
  "suspicious": 20,
  "high_risk": 12
}
```

---

## Admin

All admin endpoints require auth with `role = "admin"`. Returns 403 for non-admin users.

### `GET /api/admin/analytics`

Platform-wide aggregate analytics.

**Response 200**
```json
{
  "totalUsers": 24,
  "totalScans": 1842,
  "urlScans": 1100,
  "emailScans": 742,
  "highRiskCount": 320,
  "suspiciousCount": 510,
  "safeCount": 1012,
  "scansToday": 42,
  "scansThisWeek": 280,
  "topThreats": [
    {
      "id": 999,
      "type": "url",
      "target": "https://phishing-example.xyz/paypal",
      "riskScore": 100,
      "riskLevel": "high_risk",
      "createdAt": "2026-05-22T09:00:00.000Z"
    }
  ],
  "dailyScans": [
    { "date": "2026-04-22", "count": 18 },
    { "date": "2026-04-23", "count": 22 }
  ]
}
```

---

### `GET /api/admin/users`

Paginated list of all registered users.

**Query parameters**
| Param | Type | Default |
|-------|------|---------|
| `page` | integer | 1 |
| `limit` | integer | 20 |

**Response 200**
```json
{
  "users": [
    {
      "id": 1,
      "email": "demo@phishguard.io",
      "name": "Demo User",
      "role": "user",
      "createdAt": "2026-05-22T00:00:00.000Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/admin/reports`

Paginated view of all scan records across all users.

**Query parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |
| `riskLevel` | `safe` \| `suspicious` \| `high_risk` | — | Filter |

**Response 200**
```json
{
  "reports": [ /* ScanResult objects */ ],
  "total": 1842,
  "page": 1,
  "limit": 20
}
```

---

## Error Response Format

All error responses follow this shape:

```json
{
  "error": "Human-readable error message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 200 requests / 15 minutes |
| `/api/scan/*` | 30 requests / minute |

Exceeding a limit returns `429 Too Many Requests`.
