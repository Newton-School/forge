import express, { type Express, type Request, type Response } from "express";
import passport from "passport";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { applySecurity, csrf } from "./middleware/security.js";
import { buildSession } from "./middleware/session.js";
import { configurePassport } from "./middleware/passport.js";
import { attachAuth, enforceAbsoluteTimeout, requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { isProd } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthPayload } from "./lib/health.js";
import { openapiDocument } from "./lib/openapi.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { orgRouter } from "./modules/org/org.routes.js";
import { concernsRouter } from "./modules/concerns/concerns.routes.js";
import { reviewsRouter } from "./modules/reviews/reviews.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";
import { deliverablesRouter } from "./modules/deliverables/deliverables.routes.js";
import { milestonesRouter } from "./modules/milestones/milestones.routes.js";
import { feedbackRouter } from "./modules/feedback/feedback.routes.js";
import { demeritsRouter } from "./modules/demerits/demerits.routes.js";
import { configRouter } from "./modules/config/config.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { emailRouter, emailTrackRouter } from "./modules/email/email.routes.js";
import { invitationsRouter } from "./modules/invitations/invitations.routes.js";
import { githubRouter, githubWebhookRouter } from "./modules/github/github.routes.js";
import { discordRouter, discordWebhookRouter } from "./modules/discord/discord.routes.js";
import { calendarRouter } from "./modules/calendar/calendar.routes.js";
import { connectionsRouter } from "./modules/integrations/connections.routes.js";
import { assistantRouter } from "./modules/assistant/assistant.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import { testingRouter } from "./modules/testing/testing.routes.js";
import { publicRouter } from "./modules/public/public.routes.js";

/**
 * Build the Express app. Middleware order matters:
 *   security → logging → session → passport → attachAuth → csrf → routes → 404 → errors
 */
export function buildApp(): Express {
  const app = express();

  // Behind a TLS-terminating proxy in prod (Render / Cloudflare / ALB): trust the
  // first hop so `secure` cookies are actually set (req.secure from X-Forwarded-Proto)
  // and req.ip reflects the real client (correct per-client rate limiting).
  if (isProd) app.set("trust proxy", 1);

  applySecurity(app);
  app.use(pinoHttp({ logger }));

  // Auth/session stack
  app.use(buildSession());
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());
  // Webhooks authenticate by signature, not cookies — mount BEFORE session/CSRF/auth.
  app.use("/api/integrations/github/webhook", githubWebhookRouter);
  app.use("/api/integrations/discord/interactions", discordWebhookRouter);
  // Email open-tracking pixel is public (mail clients fetch it with no cookie).
  app.use("/api/email/track", emailTrackRouter);
  // Public landing metrics (read-only aggregates) + secret-gated recompute.
  // Public, no session/CSRF — mounted before the auth stack.
  app.use("/api/public", publicRouter);

  app.use(enforceAbsoluteTimeout); // hard session lifetime cap (beyond the rolling idle window)
  app.use(attachAuth); // loads the fresh AuthContext onto req.auth
  app.use(csrf); // double-submit CSRF for state-changing requests

  // System
  app.get("/api/health", (_req: Request, res: Response) => res.json(healthPayload()));

  // API docs (public)
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get("/api/openapi.json", (_req: Request, res: Response) => res.json(openapiDocument));

  // Feature routers
  app.use("/api/auth", authRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api/invitations", requireAuth, invitationsRouter);
  app.use("/api/org", requireAuth, orgRouter);
  app.use("/api/concerns", requireAuth, concernsRouter);
  app.use("/api/reviews", requireAuth, reviewsRouter);
  app.use("/api/projects", requireAuth, projectsRouter);
  app.use("/api/tasks", requireAuth, tasksRouter);
  app.use("/api/deliverables", requireAuth, deliverablesRouter);
  app.use("/api/milestones", requireAuth, milestonesRouter);
  app.use("/api/feedback", requireAuth, feedbackRouter);
  app.use("/api/demerits", requireAuth, demeritsRouter);
  app.use("/api/config", requireAuth, configRouter);
  app.use("/api/audit", requireAuth, auditRouter);
  app.use("/api/analytics", requireAuth, analyticsRouter);
  app.use("/api/notifications", requireAuth, notificationsRouter);
  app.use("/api/email", requireAuth, emailRouter);
  app.use("/api/integrations/github", requireAuth, githubRouter);
  app.use("/api/integrations/discord", requireAuth, discordRouter);
  app.use("/api/integrations/connections", requireAuth, connectionsRouter);
  app.use("/api/calendar", requireAuth, calendarRouter);
  app.use("/api/assistant", requireAuth, assistantRouter);
  app.use("/api/jobs", requireAuth, jobsRouter);
  app.use("/api/testing", requireAuth, testingRouter);

  // Fallbacks
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
