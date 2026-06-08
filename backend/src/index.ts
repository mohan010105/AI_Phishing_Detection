// Load .env file as early as possible
import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { env, logEnvStatus } from "./config/env.js";

// Print environment status in development
logEnvStatus();

const port = env.PORT;

app.listen(port, () => {
  logger.info("=========================================");
  logger.info("🚀 PHISHGUARD API SERVER STARTUP DIAGNOSTICS");
  logger.info(`* PORT: ${port}`);
  logger.info(`* Environment: ${env.NODE_ENV}`);
  logger.info(`* Database URL configured: ${env.DATABASE_URL ? "Yes" : "No"}`);
  logger.info(`* Supabase URL configured: ${env.SUPABASE_URL ? "Yes" : "No"}`);
  logger.info("* API Status: ONLINE");
  logger.info("=========================================");
});
