/**
 * Vercel Serverless Function entry point.
 *
 * Imports the pre-built Express application (esbuild bundle) and
 * exports it as a Vercel serverless handler.
 *
 * All /api/* routes are forwarded here via vercel.json rewrites.
 *
 * IMPORTANT: The `buildCommand` in vercel.json must run `pnpm run build`
 * which produces the api-server bundle at artifacts/api-server/dist/index.mjs
 * BEFORE this function is bundled by Vercel.
 */

// Ensure dotenv is loaded for environment variables
import "dotenv/config";

import type { IncomingMessage, ServerResponse } from "node:http";

// Import the pre-built Express app
// The api-server build.mjs produces dist/index.mjs which starts
// app.listen(). For serverless, we need the app without listen().
// We import app.ts directly and let Vercel's @vercel/node handle bundling.
import app from "../artifacts/api-server/src/app.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Express can handle raw Node.js request/response objects
  return (app as any)(req, res);
}
