/**
 * Centralized environment configuration and validation.
 *
 * Import this module early in your server entry-point so that missing
 * required variables surface immediately at boot rather than at runtime.
 *
 * Optional variables (threat-intel API keys, AI keys) are NOT required
 * — the platform gracefully degrades without them.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env file or deployment secrets.`,
    );
  }
  return value.trim();
}

function optional(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") return fallback;
  return value.trim();
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number, got: "${raw}"`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Exported configuration object
// ---------------------------------------------------------------------------

export const env = {
  // ---- App / Server ----
  NODE_ENV: optional("NODE_ENV", "development")!,
  PORT: optionalInt("PORT", 8080),
  LOG_LEVEL: optional("LOG_LEVEL", "info")!,
  isProduction: (optional("NODE_ENV", "development")) === "production",

  // ---- Database ----
  DATABASE_URL: required("DATABASE_URL"),

  // ---- Auth / JWT ----
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d")!,
  SESSION_SECRET: optional("SESSION_SECRET"),

  // ---- Supabase ----
  SUPABASE_URL: optional("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: optional("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_PUBLISHABLE_KEY: optional("SUPABASE_PUBLISHABLE_KEY"),

  // ---- Threat Intelligence (all optional — graceful degradation) ----
  VIRUSTOTAL_API_KEY: optional("VIRUSTOTAL_API_KEY"),
  GOOGLE_SAFE_BROWSING_API_KEY: optional("GOOGLE_SAFE_BROWSING_API_KEY"),
  ABUSEIPDB_API_KEY: optional("ABUSEIPDB_API_KEY"),

  // ---- AI Providers (optional — features disabled without keys) ----
  OPENAI_API_KEY: optional("OPENAI_API_KEY"),
  GEMINI_API_KEY: optional("GEMINI_API_KEY"),
  OCR_API_KEY: optional("OCR_API_KEY"),

  // ---- Email / SMTP (optional) ----
  SMTP_HOST: optional("SMTP_HOST"),
  SMTP_PORT: optionalInt("SMTP_PORT", 587),
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASS: optional("SMTP_PASS"),

  // ---- Security ----
  ENCRYPTION_KEY: optional("ENCRYPTION_KEY"),

  // ---- Frontend URLs ----
  NEXT_PUBLIC_APP_URL: optional("NEXT_PUBLIC_APP_URL"),
  NEXT_PUBLIC_API_URL: optional("NEXT_PUBLIC_API_URL"),
} as const;

// ---------------------------------------------------------------------------
// Boot-time summary (only in development)
// ---------------------------------------------------------------------------

export function logEnvStatus(): void {
  if (env.isProduction) return;

  const status = (key: string, value: string | undefined) =>
    value ? "✓" : "✗ (not set)";

  console.log("\n┌─────────────────────────────────────────────────┐");
  console.log("│       PhishGuard — Environment Status           │");
  console.log("├─────────────────────────────────────────────────┤");
  console.log(`│  NODE_ENV              : ${env.NODE_ENV.padEnd(23)}│`);
  console.log(`│  PORT                  : ${String(env.PORT).padEnd(23)}│`);
  console.log(`│  DATABASE_URL          : ${status("DATABASE_URL", env.DATABASE_URL).padEnd(23)}│`);
  console.log(`│  JWT_SECRET            : ${status("JWT_SECRET", env.JWT_SECRET).padEnd(23)}│`);
  console.log(`│  VIRUSTOTAL_API_KEY    : ${status("VT", env.VIRUSTOTAL_API_KEY).padEnd(23)}│`);
  console.log(`│  GOOGLE_SAFE_BROWSING  : ${status("GSB", env.GOOGLE_SAFE_BROWSING_API_KEY).padEnd(23)}│`);
  console.log(`│  ABUSEIPDB_API_KEY     : ${status("AIPDB", env.ABUSEIPDB_API_KEY).padEnd(23)}│`);
  console.log(`│  OPENAI_API_KEY        : ${status("OAI", env.OPENAI_API_KEY).padEnd(23)}│`);
  console.log(`│  GEMINI_API_KEY        : ${status("GEM", env.GEMINI_API_KEY).padEnd(23)}│`);
  console.log(`│  SUPABASE_URL          : ${status("SUP", env.SUPABASE_URL).padEnd(23)}│`);
  console.log("└─────────────────────────────────────────────────┘\n");
}
