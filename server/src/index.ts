/**
 * Forge server — entrypoint. Validates env, builds the app, and listens.
 * Layered architecture: routes → controllers → services → repositories (Prisma).
 * See ../CLAUDE.md and ../docs/security.md.
 */
import { buildApp } from "./app.js";
import { env, googleConfigured, mailerConfigured } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/db.js";
import { verifyMailer } from "./lib/mailer.js";
import { startSchedulers } from "./modules/jobs/jobs.scheduler.js";

const app = buildApp();
let stopSchedulers: () => void = () => {};

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      googleAuth: googleConfigured,
      mailer: mailerConfigured,
      jobs: env.JOBS_ENABLED,
    },
    "forge-server listening",
  );
  // Non-fatal: confirm SMTP works (or surface why it doesn't) without blocking boot.
  void verifyMailer();
  // Background schedulers (auto-flags / escalations) — no-op unless JOBS_ENABLED.
  stopSchedulers = startSchedulers();
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  stopSchedulers();
  server.close();
  await prisma.$disconnect().catch(() => undefined);
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
