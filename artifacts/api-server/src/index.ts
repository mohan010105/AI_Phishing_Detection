// Load .env file as early as possible
import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { env, logEnvStatus } from "./config/env.js";

// Print environment status in development
logEnvStatus();

const port = env.PORT;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
