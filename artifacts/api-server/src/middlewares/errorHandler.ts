import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? err.statusCode ?? 500;
  
  // In development, provide detailed error messages for debugging
  const isDev = process.env.NODE_ENV !== 'production';
  let message: string;
  if (status < 500) {
    message = err.message;
  } else if (isDev) {
    message = err.message || "Internal server error";
  } else {
    message = "Internal server error";
  }

  if (status >= 500) {
    logger.error({ err, url: req.url, method: req.method }, "Unhandled server error");
  } else {
    logger.warn({ err, url: req.url, method: req.method }, "Client error");
  }

  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
