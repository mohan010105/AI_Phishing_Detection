/**
 * PhishGuard — Shared Constants
 *
 * Constants shared between frontend and backend.
 */

// ---- Scan Types ----
export const SCAN_TYPES = ["url", "email", "qr", "screenshot"] as const;

// ---- Risk Levels ----
export const RISK_LEVELS = ["safe", "low", "medium", "high", "critical"] as const;

export const RISK_COLORS: Record<string, string> = {
  safe: "#22c55e",
  low: "#84cc16",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export const RISK_LABELS: Record<string, string> = {
  safe: "Safe",
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical",
};

// ---- User Roles ----
export const USER_ROLES = ["user", "admin"] as const;

// ---- API Paths ----
export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    ME: "/api/auth/me",
  },
  SCAN: {
    URL: "/api/scan/url",
    EMAIL: "/api/scan/email",
    QR: "/api/scan/qr",
    SCREENSHOT: "/api/scan/screenshot",
  },
  DASHBOARD: "/api/dashboard",
  ADMIN: "/api/admin",
  ASSISTANT: "/api/assistant",
  REPORTS: "/api/reports",
  HEALTH: "/api/healthz",
} as const;

// ---- Limits ----
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_URL_LENGTH = 2048;
export const JWT_EXPIRY_DEFAULT = "7d";
