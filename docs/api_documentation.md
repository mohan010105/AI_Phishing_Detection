# PhishGuard — API Documentation

This document provides a comprehensive specification of the REST APIs exposed by the **PhishGuard API Server**. 

## Global Configuration
- **Base URL**: `http://localhost:8080` (Development) or your production endpoint
- **Content Type**: `application/json` (unless specified otherwise for file uploads)
- **Authentication**: JWT Bearer token in the `Authorization` header (`Bearer <JWT_TOKEN>`) for all protected endpoints.

---

## 1. Authentication Endpoints

### POST `/api/auth/register`
Creates a new user account in PhishGuard.

- **Authentication Required**: No
- **Request Body**:
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "Password123!"
}
```
- **Response Body (201 Created)**:
```json
{
  "user": {
    "id": 2,
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "user",
    "createdAt": "2026-05-31T20:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response Body (400 Bad Request)**:
```json
{
  "error": "Email is already registered"
}
```

---

### POST `/api/auth/login`
Authenticates a user and issues a short-lived JWT.

- **Authentication Required**: No
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
- **Response Body (200 OK)**:
```json
{
  "user": {
    "id": 2,
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "user",
    "createdAt": "2026-05-31T20:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response Body (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password"
}
```

---

## 2. Threat Analysis & Scanning Endpoints

### POST `/api/scan/url`
Runs a multi-engine scan on a URL target using the local rule engine and external intelligence queries.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Body**:
```json
{
  "url": "http://suspicious-bank-login-update.com"
}
```
- **Response Body (200 OK)**:
```json
{
  "id": 45,
  "type": "url",
  "target": "http://suspicious-bank-login-update.com",
  "riskScore": 85,
  "riskLevel": "high_risk",
  "findings": [
    "Suspicious subdomain structure detected",
    "Google Safe Browsing: Flagged as SOCIAL_ENGINEERING",
    "VirusTotal: 8/72 engines flagged as malicious",
    "AbuseIPDB: IP flagged as highly abusive"
  ],
  "externalSources": [
    {
      "source": "VirusTotal",
      "available": true,
      "status": "malicious",
      "detail": "8/72 engines flagged as malicious",
      "score": 40
    },
    {
      "source": "Google Safe Browsing",
      "available": true,
      "status": "unsafe",
      "detail": "Threat types: Phishing / Social Engineering",
      "score": 45
    },
    {
      "source": "AbuseIPDB",
      "available": true,
      "status": "abusive",
      "detail": "IP: 198.51.100.42 · ISP: Host-Provider-Corp · Abuse score: 85%",
      "score": 35
    }
  ],
  "explanation": "This URL mimics high-profile bank portals using deceptive layouts and subdomains. Dynamic indicators from threat intelligence platforms show clear indicators of credential harvesting activity.",
  "aiSummary": {
    "summary": "High risk URL targeting online banking credentials.",
    "incidentResponse": [
      "Do not enter any personal information or credentials.",
      "Close the browser tab immediately.",
      "Report the domain to hosting authorities."
    ]
  },
  "userId": 2,
  "createdAt": "2026-05-31T20:15:30.123Z"
}
```

---

### POST `/api/scan/email`
Scans an incoming email body and header details for structural and linguistic indicators of phishing.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Body**:
```json
{
  "content": "Dear Customer, your bank account is locked! Click here immediately http://update-bank-now.com to avoid permanent suspension.",
  "subject": "Urgent Account Verification Required!",
  "sender": "no-reply@security-bank-corp.com"
}
```
- **Response Body (200 OK)**:
```json
{
  "id": 46,
  "type": "email",
  "target": "Email: Urgent Account Verification Required!",
  "riskScore": 90,
  "riskLevel": "high_risk",
  "findings": [
    "High urgency language matches social engineering profiles",
    "Target link mismatches sender identity",
    "First embedded link flagged by dynamic URL analysis"
  ],
  "explanation": "The email incorporates common social engineering tactics designed to induce panic. It contains links to a newly registered domain designed to mimic legitimate financial operations.",
  "aiSummary": {
    "summary": "Urgent account suspension lure containing credential theft link.",
    "incidentResponse": [
      "Do not reply to the sender.",
      "Do not click any embedded links.",
      "Mark the message as Spam/Phishing in your mail program."
    ]
  },
  "userId": 2,
  "createdAt": "2026-05-31T20:20:00.456Z"
}
```

---

### POST `/api/scan/qr`
Decodes a QR code image and executes dynamic scanning on the extracted URL.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Format**: `multipart/form-data`
- **Request Parts**:
  - `image`: Image file buffer (PNG, JPEG, WEBP; Max: 8MB)
- **Response Body (200 OK)**:
```json
{
  "id": 47,
  "type": "qr",
  "target": "http://qr-billing-scam-redirect.com",
  "extractedFrom": "qr",
  "riskScore": 75,
  "riskLevel": "high_risk",
  "findings": [
    "Obfuscated redirect sequence found",
    "VirusTotal: 3 engines flagged as malicious"
  ],
  "externalSources": [
    {
      "source": "VirusTotal",
      "available": true,
      "status": "malicious",
      "detail": "3/72 engines flagged as malicious",
      "score": 15
    },
    {
      "source": "Google Safe Browsing",
      "available": true,
      "status": "safe",
      "detail": "No threats detected",
      "score": 0
    },
    {
      "source": "AbuseIPDB",
      "available": true,
      "status": "clean",
      "detail": "Abuse score: 0%",
      "score": 0
    }
  ],
  "explanation": "This QR code embeds a URL pointing to a payment billing portal. Third-party intelligence platforms show cached alerts for unauthorized credential routing.",
  "recommendation": {
    "category": "High Threat Level Intercepted",
    "title": "Quishing Attempt Detected",
    "steps": [
      "Avoid visiting the destination on your smartphone.",
      "Discard any physical posters or materials containing the QR code.",
      "Warn organization network managers regarding this vector."
    ]
  },
  "userId": 2,
  "createdAt": "2026-05-31T22:05:00.000Z"
}
```

---

### POST `/api/scan/screenshot`
Analyzes a screenshot of a webpage or email layout via the dual-provider vision assistant to classify the threat layout.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Format**: `multipart/form-data`
- **Request Parts**:
  - `image`: Screenshot image file buffer (PNG, JPEG, WEBP; Max: 8MB)
- **Response Body (200 OK)**:
```json
{
  "riskScore": 85,
  "riskLevel": "high_risk",
  "findings": [
    "Detected input form mimicking Google Accounts sign-in logo",
    "Page title lacks matching domain identity in the visible address bar",
    "Detected high visual resemblance to online service login console"
  ],
  "explanation": "This screenshot displays a clear brand impersonation attempt targeting cloud identities. The domain mismatch is a strong indicator of an active credential harvesting campaign.",
  "aiSummary": {
    "detectedBrands": ["Google Accounts"],
    "indicators": ["Deceptive Login Forms", "Favicon Spoofing"],
    "verdict": "High risk brand impersonation site."
  },
  "detectedText": "Sign in with your Google Account Email or phone Forgot email?"
}
```

---

### POST `/api/scan/compare`
Compares two threats to evaluate risk hierarchy and output a consolidated threat landscape synthesis.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Body**:
```json
{
  "typeA": "url",
  "targetA": "http://suspicious-bank-login-update.com",
  "typeB": "url",
  "targetB": "http://safe-bank-portal-verified.com"
}
```
- **Response Body (200 OK)**:
```json
{
  "a": {
    "target": "http://suspicious-bank-login-update.com",
    "type": "url",
    "riskScore": 85,
    "riskLevel": "high_risk",
    "findings": [
      "Suspicious subdomain structure detected",
      "Google Safe Browsing: Flagged as SOCIAL_ENGINEERING"
    ],
    "explanation": "Active banking credential harvest portal.",
    "incidentResponse": [
      "Close the portal tab immediately.",
      "Report domain hosts."
    ]
  },
  "b": {
    "target": "http://safe-bank-portal-verified.com",
    "type": "url",
    "riskScore": 5,
    "riskLevel": "safe",
    "findings": [],
    "explanation": "Clean and highly reputable domain verification.",
    "incidentResponse": [
      "This target appears safe for standard use."
    ]
  },
  "summary": "Target A represents an active banking phishing vector with multiple threat intelligence flags. In contrast, Target B is a verified, highly reputable secure portal. Target A is extremely dangerous and must be avoided.",
  "winner": "a"
}
```

---

## 3. Companion AI Assistant Endpoints

### POST `/api/assistant/chat`
Interacts with the AI Cybersecurity Companion using an advanced dual-provider (OpenAI first, Gemini fallback) system.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Request Body**:
```json
{
  "message": "What is the difference between phishing and quishing?"
}
```
- **Response Body (200 OK)**:
```json
{
  "response": "Phishing refers broadly to digital attacks designed to steal sensitive data (like passwords) by masquerading as a trustworthy entity. Quishing is a specialized subset of phishing that uses Quick Response (QR) codes as the delivery mechanism to hide malicious URLs from traditional email security filters."
}
```
- **Response Body (503 Service Unavailable)**:
```json
{
  "error": "I encountered an error processing your request. Please try again.",
  "code": "OPENAI_AUTH_FAILED",
  "details": "All AI core services are currently unreachable. Diagnostics logged."
}
```

---

## 4. History & Reporting Endpoints

### GET `/api/history`
Retrieves paginated search and threat scan records for the logged-in user.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Query Parameters**:
  - `page`: Page index (Default: `1`)
  - `limit`: Records per page (Default: `20`)
  - `type`: Target filter (`"url"` or `"email"`)
- **Response Body (200 OK)**:
```json
{
  "scans": [
    {
      "id": 45,
      "type": "url",
      "target": "http://suspicious-bank-login-update.com",
      "riskScore": 85,
      "riskLevel": "high_risk",
      "findings": [
        "Suspicious subdomain structure detected",
        "Google Safe Browsing: Flagged as SOCIAL_ENGINEERING"
      ],
      "userId": 2,
      "createdAt": "2026-05-31T20:15:30.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/reports`
Retrieves consolidated analytics feeds of high-risk threat profiles.

- **Authentication Required**: Yes (`Bearer <JWT_TOKEN>`)
- **Response Body (200 OK)**:
```json
[
  {
    "id": 45,
    "type": "url",
    "target": "http://suspicious-bank-login-update.com",
    "riskScore": 85,
    "riskLevel": "high_risk",
    "createdAt": "2026-05-31T20:15:30.000Z"
  }
]
```
