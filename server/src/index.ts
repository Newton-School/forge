/**
 * Forge server — entrypoint. Validates env, builds the app, and listens.
 * Layered architecture: routes → controllers → services → repositories (Prisma).
 * See ../CLAUDE.md and ../docs/security.md.
 */
import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { buildApp } from "./app.js";
import { env, googleConfigured, mailerConfigured } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/db.js";
import { verifyMailer } from "./lib/mailer.js";
import { startSchedulers } from "./modules/jobs/jobs.scheduler.js";

const app = buildApp();
let stopSchedulers: () => void = () => {};

// Local HTTPS (dev only): when a cert is present, serve TLS so OAuth redirect URIs are
// https (e.g. Newton's https://localhost:8000/newton/callback). Production terminates TLS
// at the ALB, where no cert file exists → plain http. mkcert: see server/README.md.
const keyFile = env.HTTPS_KEY_FILE ?? "certs/localhost-key.pem";
const certFile = env.HTTPS_CERT_FILE ?? "certs/localhost.pem";
const useHttps = existsSync(keyFile) && existsSync(certFile);
const httpServer = useHttps
  ? https.createServer({ key: readFileSync(keyFile), cert: readFileSync(certFile) }, app)
  : http.createServer(app);

const server = httpServer.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      scheme: useHttps ? "https" : "http",
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
