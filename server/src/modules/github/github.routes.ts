import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { env, githubOAuthConfigured, isProd } from "../../config/env.js";
import * as svc from "./github.service.js";
import * as connect from "./github.connect.js";
import { githubApi } from "./github.api.js";
import { githubRead } from "./github.read.js";

const listQuery = z.object({
  teamId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * PUBLIC webhook receiver. Mounted BEFORE the session/CSRF/auth stack — GitHub
 * authenticates with an HMAC signature, not a cookie. Verification happens in the
 * service against the raw request bytes captured by the JSON parser.
 */
export const githubWebhookRouter = Router();
githubWebhookRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await svc.ingestWebhook(
      req.get("x-github-event"),
      req.get("x-hub-signature-256"),
      req.get("x-github-delivery"),
      req.rawBody,
      req.body,
    );
    res.json(result);
  }),
);

/** Authenticated read side (mounted after requireAuth). */
export const githubRouter = Router();

// ── "Connect with GitHub" (OAuth) — every authenticated user; the redirect carries
//    the session cookie back, so req.auth identifies who is connecting. ───────────────
const CLIENT = env.APP_BASE_URL;
const startQuery = z.object({
  repo: z.string().trim().max(200).optional(),
  teamId: z.string().trim().max(64).optional(),
});

/** Begin the consent flow. A mentor may pass ?repo=&teamId= to also wire the webhook. */
githubRouter.get(
  "/oauth/start",
  asyncHandler(async (req: Request, res: Response) => {
    if (!githubOAuthConfigured) return res.redirect(`${CLIENT}/connections?github=unconfigured`);
    const { repo, teamId } = startQuery.parse(req.query);
    const { url, nonce } = connect.buildStart({ repo, teamId });
    res.cookie(connect.STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 10 * 60 * 1000,
      path: "/api/integrations/github",
    });
    res.redirect(url);
  }),
);

/** GitHub returns here. Verify state, link identity, optionally create the repo webhook. */
githubRouter.get(
  "/oauth/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const cookieNonce = req.cookies?.[connect.STATE_COOKIE] as string | undefined;
    res.clearCookie(connect.STATE_COOKIE, { path: "/api/integrations/github" });
    if (!code) return res.redirect(`${CLIENT}/connections?github=denied`);
    const result = await connect.handleCallback(req.auth!, code, state, cookieNonce, req.ip);
    const handle = result.login ? `&u=${encodeURIComponent(result.login)}` : "";
    res.redirect(`${CLIENT}/connections?github=${result.status}${handle}`);
  }),
);

githubRouter.get(
  "/activity",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listActivity(req.auth!, listQuery.parse(req.query)));
  }),
);

githubRouter.get(
  "/status",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(svc.status());
  }),
);

// Live connectivity probe — confirms the token can read the configured org.
githubRouter.get(
  "/check",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await githubApi.ping());
  }),
);

// ── AI-domain read endpoints (read-through to GitHub; scoping hardened in Phase 3) ──
const repoParam = z.object({ repo: z.string().min(1).max(120) });
const keyParam = z.object({ key: z.string().min(1).max(120) });

githubRouter.get("/org", requirePermission("review:read"),
  asyncHandler(async (_req, res: Response) => res.json(await githubRead.orgOverview())));

githubRouter.get("/projects", requirePermission("review:read"),
  asyncHandler(async (_req, res: Response) => res.json({ items: await githubRead.projects() })));

githubRouter.get("/projects/:key", requirePermission("review:read"),
  asyncHandler(async (req, res: Response) => res.json(await githubRead.projectComparison(keyParam.parse(req.params).key))));

githubRouter.get("/repos/:repo", requirePermission("review:read"),
  asyncHandler(async (req, res: Response) => res.json(await githubRead.repoDetail(repoParam.parse(req.params).repo))));

githubRouter.get("/repos/:repo/analytics", requirePermission("review:read"),
  asyncHandler(async (req, res: Response) => res.json(await githubRead.repoAnalytics(repoParam.parse(req.params).repo))));

githubRouter.get("/repos/:repo/contributors", requirePermission("review:read"),
  asyncHandler(async (req, res: Response) => res.json({ items: await githubRead.repoContributors(repoParam.parse(req.params).repo) })));

githubRouter.get("/teams", requirePermission("review:read"),
  asyncHandler(async (_req, res: Response) => res.json({ items: await githubRead.teams() })));
