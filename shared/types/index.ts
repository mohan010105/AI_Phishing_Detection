/**
 * PhishGuard — Shared Type Definitions
 *
 * Types used by both the frontend and backend.
 * Import from "../../shared/types" or copy as needed.
 */

// ---- User / Auth ----

export type UserRole = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string | Date;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

// ---- Scan ----

export type ScanType = "url" | "email" | "qr" | "screenshot";
export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface ScanResult {
  id: number;
  userId: number;
  scanType: ScanType;
  target: string;
  riskLevel: RiskLevel;
  riskScore: number;
  details: Record<string, unknown>;
  sources: string[];
  aiExplanation?: string;
  recommendations?: string[];
  created_at: string | Date;
}

export interface ScanRequest {
  scanType: ScanType;
  target: string;
  options?: Record<string, unknown>;
}

// ---- Dashboard ----

export interface DashboardStats {
  totalScans: number;
  safeScanCount: number;
  threatDetectedCount: number;
  recentScans: ScanResult[];
  scansByType: Record<ScanType, number>;
  riskDistribution: Record<RiskLevel, number>;
}

// ---- AI Assistant ----

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
}

export interface AssistantChatRequest {
  message: string;
  context?: string;
}

// ---- API Envelope ----

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
