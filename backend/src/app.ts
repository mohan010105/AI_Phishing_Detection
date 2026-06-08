import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app: Express = express();

// Cloud platforms (Render, Vercel, etc.) sit behind a reverse proxy — trust the
// X-Forwarded-For header so express-rate-limit can identify clients correctly.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

// CORS: In production, restrict to the frontend URL. In development, allow all.
const corsOrigin = env.FRONTEND_URL
  ? [env.FRONTEND_URL, "http://localhost:5173"]
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many scan requests, please slow down" },
});

app.use(globalLimiter);
app.use("/api/scan", scanLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Catch-all for API routes that do not match any defined endpoint
app.use(notFoundHandler);

app.use(errorHandler);

export default app;
