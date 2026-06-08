/**
 * PhishGuard — Shared Interfaces
 *
 * Service interfaces that define contracts between frontend and backend.
 */

export interface IScanService {
  scanUrl(url: string): Promise<unknown>;
  scanEmail(content: string): Promise<unknown>;
  scanQr(imageData: string | Blob): Promise<unknown>;
  scanScreenshot(imageData: string | Blob): Promise<unknown>;
}

export interface IAuthService {
  login(email: string, password: string): Promise<unknown>;
  register(name: string, email: string, password: string): Promise<unknown>;
  forgotPassword(email: string): Promise<unknown>;
  resetPassword(token: string, newPassword: string): Promise<unknown>;
  getCurrentUser(token: string): Promise<unknown>;
}

export interface IAssistantService {
  chat(message: string, context?: string): Promise<unknown>;
  getHistory(userId: number): Promise<unknown>;
}
