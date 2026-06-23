import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { env, discordOAuthConfigured, isProd } from "../../config/env.js";
import * as svc from "./discord.service.js";
import * as connect from "./discord.connect.js";

const listQuery = z.object({
  teamId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * PUBLIC Discord interactions receiver. Mounted BEFORE session/CSRF/auth — Discord
 * authenticates with an Ed25519 signature over the raw body, not a cookie.
 */
export const discordWebhookRouter = Router();
discordWebhookRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await svc.handleInteraction(
      req.get("x-signature-ed25519"),
      req.get("x-signature-timestamp"),
      req.rawBody,
      req.body,
      new Date(),
    );
    res.json(result);
  }),
);

/** Authenticated read side. */
export const discordRouter = Router();

// ── "Connect with Discord" (OAuth2) — every authenticated user; the redirect carries the
//    session cookie back, so req.auth identifies who is connecting. Mirrors the GitHub flow. ──
const CLIENT = env.APP_BASE_URL;

discordRouter.get(
  "/oauth/start",
  asyncHandler(async (_req: Request, res: Response) => {
    if (!discordOAuthConfigured) return res.redirect(`${CLIENT}/connections?discord=unconfigured`);
    const { url, nonce } = connect.buildStart();
    res.cookie(connect.STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 10 * 60 * 1000,
      path: "/api/integrations/discord",
    });
    res.redirect(url);
  }),
);

discordRouter.get(
  "/oauth/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const cookieNonce = req.cookies?.[connect.STATE_COOKIE] as string | undefined;
    res.clearCookie(connect.STATE_COOKIE, { path: "/api/integrations/discord" });
    if (!code) return res.redirect(`${CLIENT}/connections?discord=denied`);
    const result = await connect.handleCallback(req.auth!, code, state, cookieNonce, req.ip);
    const handle = result.username ? `&u=${encodeURIComponent(result.username)}` : "";
    res.redirect(`${CLIENT}/connections?discord=${result.status}${handle}`);
  }),
);

discordRouter.get(
  "/activity",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listActivity(req.auth!, listQuery.parse(req.query)));
  }),
);

discordRouter.get(
  "/status",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(svc.status());
  }),
);

// Live connectivity probe — confirms the bot token reaches Discord.
discordRouter.get(
  "/check",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await svc.check());
  }),
);
