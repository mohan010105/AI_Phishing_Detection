# PhishGuard — AI Phishing Detection Platform

> An AI-powered cybersecurity platform that detects phishing threats across URLs, emails, QR codes, and screenshots using VirusTotal, Google Safe Browsing, AbuseIPDB, and OpenAI.

---

## Architecture

```
phishguard/
├── frontend/          → React + Vite SPA (deployed to Vercel)
├── backend/           → Express API server (deployed to Render)
├── shared/            → Shared types, constants, and interfaces
├── docs/              → Project documentation
├── .gitignore
├── package.json       → Root convenience scripts
└── README.md
```

### Frontend (`frontend/`)

| Stack       | Details                        |
|-------------|--------------------------------|
| Framework   | React 19 + TypeScript          |
| Bundler     | Vite 7                         |
| Styling     | Tailwind CSS 4                 |
| UI Library  | Radix UI + shadcn/ui           |
| State       | TanStack React Query           |
| Routing     | Wouter                         |
| Deployment  | Vercel                         |

### Backend (`backend/`)

| Stack       | Details                        |
|-------------|--------------------------------|
| Runtime     | Node.js + TypeScript           |
| Framework   | Express 5                      |
| Database    | PostgreSQL via Drizzle ORM     |
| Auth        | JWT (bcryptjs + jsonwebtoken)  |
| AI          | OpenAI GPT-4                   |
| APIs        | VirusTotal, Safe Browsing, AbuseIPDB |
| Deployment  | Render                         |

### Database

| Platform | Details                           |
|----------|-----------------------------------|
| Supabase | PostgreSQL + Auth + Row-Level Security |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Install Dependencies

```bash
# Install both frontend and backend
npm run install:all

# Or individually:
cd frontend && npm install
cd backend && npm install
```

### 2. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=                    # Leave blank for dev (Vite proxy handles it)
```

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
JWT_SECRET=your-random-64-byte-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
VIRUSTOTAL_API_KEY=your-key
GOOGLE_SAFE_BROWSING_API_KEY=your-key
OPENAI_API_KEY=your-key
```

### 3. Run Development Servers

```bash
# From root — starts both frontend and backend
npm run dev

# Or individually:
npm run dev:frontend    # http://localhost:5173
npm run dev:backend     # http://localhost:8080
```

### 4. Build for Production

```bash
npm run build
```

---

## Features

| Feature              | Description                                       |
|----------------------|---------------------------------------------------|
| 🔗 URL Scanner       | VirusTotal + Google Safe Browsing + AI analysis   |
| 📧 Email Scanner     | Phishing pattern detection in email content       |
| 📱 QR Code Scanner   | Decode and analyze QR codes for malicious URLs    |
| 📸 Screenshot AI     | AI-powered visual phishing detection              |
| 🤖 AI Assistant      | GPT-4 powered cybersecurity chatbot               |
| 📊 Dashboard         | Real-time threat analytics and scan history       |
| 📝 Reports           | PDF report generation for scan results            |
| 👤 Auth System       | JWT-based registration, login, password reset     |
| 🛡️ Admin Console     | User management and platform-wide analytics       |
| 🎯 Risk Scoring      | Multi-source threat intelligence risk assessment  |

---

## Deployment

### Frontend → Vercel

1. Import repo to Vercel
2. Set **Root Directory**: `frontend`
3. Set **Framework Preset**: Vite
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` = `https://phishguard-api.onrender.com`

### Backend → Render

1. Create new **Web Service** from repo
2. Set **Root Directory**: `backend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run start`
5. Add all environment variables from `backend/.env.example`

### Database → Supabase

1. Create a new Supabase project
2. Copy the `DATABASE_URL` from Settings → Database
3. Run `npm run db:push --prefix backend` to push the schema

---

## Project Structure — Detailed

```
frontend/
├── src/
│   ├── components/       → React components (UI + feature)
│   │   └── ui/           → shadcn/ui components
│   ├── pages/            → Route pages
│   ├── hooks/            → Custom React hooks (auth, toast, etc.)
│   ├── services/         → API client (generated + custom-fetch)
│   │   └── generated/    → Auto-generated API client
│   ├── lib/              → Utility functions
│   ├── App.tsx           → Root component + routing
│   ├── main.tsx          → Entry point
│   └── index.css         → Global styles
├── public/               → Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json           → Vercel deployment config
└── .env.example

backend/
├── src/
│   ├── routes/           → Express route handlers
│   ├── services/         → Business logic (AI, scanning, etc.)
│   ├── middlewares/      → Auth, error handling middleware
│   ├── database/         → Drizzle ORM setup + schema
│   │   └── schema/       → Database table definitions
│   ├── config/           → Environment variable validation
│   ├── constants/        → Backend constants
│   ├── lib/              → Logger, utilities
│   ├── utils/            → Helper functions
│   ├── validation/       → Zod validation schemas
│   ├── app.ts            → Express app setup
│   └── index.ts          → Server entry point
├── build.mjs             → esbuild production bundler
├── package.json
├── tsconfig.json
├── render.yaml           → Render deployment config
└── .env.example

shared/
├── types/                → TypeScript type definitions
├── constants/            → Shared constants
├── interfaces/           → Service interfaces
├── validation/           → Shared Zod schemas
└── package.json

docs/
├── architecture.md
├── deployment_guide.md
├── api_documentation.md
├── database_documentation.md
├── security.md
├── testing_documentation.md
├── user_manual.md
└── ...
```

---

## License

MIT
