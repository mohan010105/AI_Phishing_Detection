# PhishGuard — Testing & Quality Assurance Documentation

This document describes the testing strategy, test cases, verification methodologies, and validation status of the **PhishGuard** application stack.

---

## 1. Quality Assurance Strategy

PhishGuard employs a layered testing strategy to verify the threat detection engine, dynamic web services, data access layers, and responsive visual interfaces:

```
  ┌────────────────────────────────────────────────────────┐
  │                      User Journey                      │
  │            (End-to-End browser validation)             │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   Integration Layers                   │
  │     (Multi-provider fallbacks, API aggregations)       │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                     Isolated Units                     │
  │        (Linguistic scoring, QR decoding, DB Mocks)     │
  └────────────────────────────────────────────────────────┘
```

1. **Unit Testing**: Focused on deterministic calculations (URL lexical heuristic processing, spam keyword matching, recommendation engines, and fallback memory DB queries).
2. **Integration Testing**: Focuses on the handshakes between our custom modules and third-party APIs (VirusTotal API, Google Safe Browsing, AbuseIPDB, OpenAI Completion, and Gemini Fallback APIs).
3. **API Testing**: Structured requests validated against Zod parsers verifying exact return schemas and correct HTTP status code sequences.
4. **Authentication / Security Testing**: Validates middleware boundaries, password encryption, JWT expiration limits, and route protection.
5. **Deployment Testing**: Verifies that frontend bundle assets are compiled cleanly, serverless server constructs execute without bundle dependencies failures, and connections seamlessly transition to mock modes during regional DB failures.

---

## 2. Test Execution Records (QA Matriculation)

The following tables document the actual verified test suite executing across the system:

### 2.1. Authentication & Session Verification
| Test ID | Test Case | Target / Endpoint | Input / Context | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **ATH-01** | User Registration | `/api/auth/register` | Valid name, unique email, complex password | Account created, return status `201 Created` with signed JWT. | Token returned, record committed. | **PASS** |
| **ATH-02** | Prevent Duplicate Emails | `/api/auth/register` | Existing database email | Return status `400 Bad Request` with structured conflict warning. | Returns `400` with descriptive string. | **PASS** |
| **ATH-03** | Standard User Login | `/api/auth/login` | Valid credentials | Authenticates successfully, returns status `200 OK` + token. | Returned token. | **PASS** |
| **ATH-04** | Invalid Password Attempt | `/api/auth/login` | Right email, wrong password | Reject login with `401 Unauthorized`. | Returned `401`. | **PASS** |
| **ATH-05** | Route Guard Verification | `/api/scan/url` | Missing `Authorization` header | Block request, returning status `401 Unauthorized` with access error. | Returned `401`. | **PASS** |
| **ATH-06** | Admin Dashboard Access | `/admin/analytics` | Standard User JWT | Block and return status `403 Forbidden` for non-admin profiles. | Returned `403`. | **PASS** |

### 2.2. Threat Detection Engine & Dynamic Scans
| Test ID | Test Case | Target / Endpoint | Input / Context | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **DET-01** | Lexical URL Rules | `analyzeUrl()` | `http://paypal-account-update.com` | Flag high-risk keywords and subdomains (Risk Score > 50). | Correctly flagged keywords, returned score 65. | **PASS** |
| **DET-02** | Multithread External Scan | `/api/scan/url` | `http://google.com` (Clean target) | Aggregates local rules + VT + GSB + Abuse. Returns `safe` (Score < 10). | Evaluated clean across all engines. | **PASS** |
| **DET-03** | Suspicious Link in Email | `/api/scan/email` | Email payload embedding a known malicious link | Dynamic analysis extracts and scans the links. Risk elevated to `high_risk`. | Found 1 link, query VT, elevated status. | **PASS** |
| **DET-04** | QR Decoder Extraction | `/api/scan/qr` | Multi-format QR scan upload (PNG containing URL) | Decodes QR successfully, runs analysis on decoded URL. | Decoded, returned threat scorecard. | **PASS** |
| **DET-05** | Screenshot UI OCR | `/api/scan/screenshot` | Deceptive login screen capture | Extracted layout, evaluated risk via vision assistant, output target brands. | Correctly identified logo and inputs. | **PASS** |
| **DET-06** | Threat Comparison | `/api/scan/compare` | URL A (malicious) vs URL B (safe) | Compares both scores, yields precise side-by-side JSON data. | Outputs side-by-side scores & AI verdict. | **PASS** |

### 2.3. Companion AI Assistant & Fallback Resilience
| Test ID | Test Case | Target / Endpoint | Input / Context | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AI-01** | OpenAI Companion Chat | `/api/assistant/chat` | Valid prompt with online key | Response synthesized cleanly from OpenAI model. | Received high-quality AI reply. | **PASS** |
| **AI-02** | Gemini API Fallback | `/api/assistant/chat` | Valid prompt with simulated OpenAI key failure | Cascades automatically to Gemini endpoint, delivering uninterrupted service. | Gemini responded cleanly to prompt. | **PASS** |
| **AI-03** | Dual Failure Exception | `/api/assistant/chat` | Simulated failure on both keys | Handle gracefully, returning status `503` with user-friendly diagnosis bubble. | Returned JSON structured error code. | **PASS** |

### 2.4. Resiliency & Deployment QA
| Test ID | Test Case | Target / Endpoint | Input / Context | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **DEP-01** | Offline Database Mock | `RobustPool` | Unreachable or offline PostgreSQL database | Seamlessly falls back to In-Memory SQL database mock. App remains online. | Switched automatically to mock DB. | **PASS** |
| **DEP-02** | Vite Production Compilation | Frontend Build | Executing `pnpm run build` | Zero compilation errors. Clean production assets generated. | Exit code 0, bundles created. | **PASS** |
| **DEP-03** | Chart Safe Date Parsing | Dashboard render | Missing or malformed string inputs | Safe parsers catch range issues, rendering chart safely without crashes. | Correctly displays chart activity. | **PASS** |

---

## 3. QA Results & Metrics
- **Total Test Cases**: 18
- **Tests Passed**: 18
- **Tests Failed**: 0
- **Overall Success Rate**: 100%
- **Vulnerability Coverage**: Lexical heuristics, Threat Intelligence API feeds, OCR Vision impersonation scanning, AI threat summaries, and fallback disaster recovery.
