# 🛡️ PhishGuard

### **Multi-Engine Phishing & Quishing Detection System Powered by Cognitive Intelligence Heuristics & Dynamic APIs**

---

## 🌟 Overview

**PhishGuard** is an advanced, production-grade cybersecurity intelligence platform designed to intercept, analyze, and explain digital social engineering attacks. By combining deterministic lexical heuristics, dynamic multi-database threat intelligence queries, machine vision analysis, and large language model explainers, PhishGuard protects users from sophisticated phishing, quishing (QR code manipulation), email fraud, and visual brand impersonation campaigns.

PhishGuard features a high-availability design that seamlessly shifts to local SQL database mocks during cloud server outages, and routes AI chat queries to a fallback provider if rate limits are hit. Packaged as a robust monorepo utilizing React 19, TypeScript, Express, Drizzle ORM, and Supabase.

---

## ⚠️ Problem Statement

Social engineering attacks represent a significant threat to global digital infrastructure. Modern threat vectors have evolved past simple email templates:
1. **Multi-Vector Attacks**: Phishing attacks are heavily diversified across URLs, structured emails, physical QR codes (Quishing), and visual brand spoofing.
2. **Cognitive Blindspots**: Traditional security tools output raw technical threat metrics (e.g., `Google Safe Browsing: Flagged as SOCIAL_ENGINEERING`) that confuse non-technical users.
3. **Reactive blacklists**: Single-feed security checkers are vulnerable to zero-day domains that have not yet been blacklisted.

---

## 💡 The Solution

PhishGuard provides a proactive, multi-tier threat aggregation and explanation system:
- **Heuristics & APIs**: Combines local lexical scanners with simultaneous queries to VirusTotal, Google Safe Browsing, and AbuseIPDB.
- **Natural Language Explanations**: Uses Large Language Models (LLMs) to explain threat signatures to users in simple, natural language.
- **Resilient Infrastructure**: Guarantees high availability using local database and API fallback pipelines.
- **Unified Command Center**: Renders telemetry data, trend charts, and chat interfaces in a responsive dark-mode dashboard.

---

## 🚀 Core Features

### 🔐 1. Authentication & RBAC
- Stateless session management using secure, signed JSON Web Tokens (JWT).
- Secure password encryption using the **bcrypt** hashing algorithm.
- Middleware verification to enforce standard and administrator account access bounds.

### 🌐 2. URL Scanner
- Heuristic checks scan targets for suspicious keywords, subdomains, character entropy, and age indicators.
- Simultaneously aggregates live scoring metrics from VirusTotal, Google Safe Browsing, and AbuseIPDB.
- Consolidates threat data into a single risk scorecard (0-100) and risk level.

### 📧 3. Email Analyzer
- Parses message content for urgency indicators, payment requests, and sensitive data prompts (e.g., SSN, credit cards).
- Compares sender signatures against link profiles to flag mismatch anomalies.
- Automatically extracts and scans embedded URLs.

### 📱 4. QR Scanner (Quishing Defender)
- Pre-processes images using Jimp to optimize contrast and thresholding levels.
- Decodes QR code matrices into plain-text targets using the `jsQR` algorithm.
- Safely evaluates decoded destination URLs before they reach a user's smartphone.

### 👁️ 5. Screenshot AI (Impersonation Defender)
- Extracts hidden layout texts from screenshots using image text recognition.
- Uses vision LLMs to detect visual brand impersonation attempts on login screens (e.g., mimicking Google Accounts sign-in layouts).

### 💬 6. Companion AI Assistant
- Interactive cybersecurity co-pilot that explains complex threat indicators and security vocabulary.
- Features a fallback pipeline to route chat queries to Gemini automatically if OpenAI is unavailable, guaranteeing constant uptime.

### ⚖️ 7. Threat Comparison Tool
- Runs side-by-side risk scans and outputs an AI-synthesized verdict explaining which target represents the greater security risk.

### 📄 8. Actionable PDF Threat Reports
- Generates and downloads professionally formatted PDF reports in the browser, complete with scan findings and custom incident response steps.

### 📊 9. Dashboard Telemetry & Analytics
- Renders per-user scan stats, risk category breakdowns, and weekly scan volumes using responsive charts.

### ⚙️ 10. Admin Console
- Renders central platform statistics, including 30-day telemetry trends, risk distributions, and operator tables.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion, Wouter Router |
| **Backend Core** | Node.js, Express, Multer, Zod Schema Validation, Pino |
| **Database** | PostgreSQL, Drizzle ORM, Supabase Cloud Storage |
| **APIs** | VirusTotal API, Google Safe Browsing API, AbuseIPDB API |
| **AI / OCR Core** | OpenAI API (GPT-4o-mini), Google Gemini API (Gemini 2.0 Flash), jsQR, Jimp OCR |

---

## 📦 Monorepo Workspace Structure

```
workspace/
├── artifacts/
│   ├── api-server/         Express API backend, routes, config, and services
│   ├── phishing-detector/  Modern React SPA frontend
│   └── mockup-sandbox/     Visual UI sandboxing environment
├── lib/
│   ├── api-spec/           OpenAPI specifications
│   ├── api-client-react/   Generated API hooks
│   ├── api-zod/            Generated validation schemas
│   └── db/                 PostgreSQL tables, migrations, and connections
├── docs/                   Complete project deliverables folder
└── README.md               Main documentation interface
```

---

## ⚙️ Environment Variables

Create a `.env` file at the project root and populate these variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080

# Database Persistence
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres

# Security / Tokenization
JWT_SECRET=your-64-character-random-hex-string
SESSION_SECRET=your-random-session-secret

# Threat Intelligence APIs
VIRUSTOTAL_API_KEY=your-virustotal-api-key
GOOGLE_SAFE_BROWSING_API_KEY=your-safe-browsing-key
ABUSEIPDB_API_KEY=your-abuseipdb-key

# Cognitive AI Engines
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

---

## 🚀 Quick Start Guide

### 1. Prerequisite Installations
- **Node.js**: v24+
- **pnpm**: v9+ (Recommended package manager)

### 2. Workspace Installation
Install all monorepo dependencies and build the internal packages:
```bash
# Clone the repository and install dependencies
pnpm install

# Initialize database schemas on Supabase
pnpm --filter "@workspace/db" db:push

# Seed demo data
pnpm --filter "@workspace/db" db:seed
```

### 3. Running the Development Servers
Start both the backend API server and frontend SPA client:
```bash
# Start backend and frontend simultaneously
pnpm dev
```
- **Backend API**: Running on `http://localhost:8080`
- **Frontend Client**: Running on `http://localhost:5173`

### 4. Code Quality & Builds
```bash
# Verify type safety across all workspaces
pnpm run typecheck

# Compile production-ready builds
pnpm run build
```

---

## 🔑 Demo Accounts

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Standard Operator** | `demo@phishguard.io` | `Demo1234!` |
| **Security Administrator** | `admin@phishguard.io` | `Demo1234!` |

---

## 📂 Project Deliverables & Submission Package

To access the complete project documentation and major project deliverables, explore the files in the **`docs/`** directory:

- 📄 **[Major Project Report](docs/project_report.md)**: Academic report containing 23 chapters, including Literature Survey, Database Design, System Architecture, and Security Features.
- 📊 **[PowerPoint Presentation Slides](docs/presentation_content.md)**: Structured slide-by-slide outlines, visuals, and presenter notes for project reviews.
- 🔌 **[API Specifications Guide](docs/api_documentation.md)**: Reference document containing request/response schemas, JSON examples, and auth parameters.
- 🗄️ **[Database Architecture](docs/database_documentation.md)**: Renders entity maps, table constraints, compound indexes, and custom enum definitions.
- 🧪 **[Quality Assurance & Testing](docs/testing_documentation.md)**: Comprehensive testing tables verifying heuristics, vision scans, and system resiliency.
- 🌐 **[Operations & Deployment Guide](docs/deployment_guide.md)**: Step-by-step guides for deploying on Vercel, Supabase, and Render.
- 📖 **[User Manual](docs/user_manual.md)**: End-to-end user guide explaining all application scanner interfaces.
- 🎓 **[viva Preparation Guide](docs/viva_preparation.md)**: Placement-ready prep guide containing 150 questions and answers across technical and academic topics.
- 💼 **[GitHub Showcase Pack](docs/github_and_portfolio.md)**: Ready-to-use descriptions and posts for personal portfolios, resumes, and LinkedIn.

---

## 🔮 Future Roadmap

- **Browser Extension**: Real-time traffic checks directly within user browser workflows.
- **Offline OCR Models**: Moves visual screen analysis offline to improve privacy.
- **Active Domain Monitoring**: Automatically tracks new registrations targeting known company domains.
- **LDAP Integration**: Single Sign-On support for corporate networks.

---

## 👥 Authors

- **[Candidate Name]** — Lead Developer / Security Engineer
- Under the guidance of **[Advisor/Professor Name]**
