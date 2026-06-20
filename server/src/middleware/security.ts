import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "node:crypto";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { Errors } from "../lib/errors.js";

const CSRF_COOKIE = "forge_csrf";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Baseline platform + security middleware applied to every request. */
export function applySecurity(app: Express): void {
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind Cloudflare + ALB
  app.use(helmet());
  app.use(compression());
  // Capture the raw bytes so webhook handlers can verify HMAC signatures.
  app.use(express.json({ limit: "1mb", verify: (req, _res, buf) => { (req as Request).rawBody = buf; } }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  // Only the first-party client origin may call the API, with credentials (cookies).
  app.use(cors({ origin: env.APP_BASE_URL, credentials: true }));
  // Global rate limit (auth endpoints add a tighter limit of their own).
  app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));
}

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stateless CSRF (double-submit cookie): ensure a non-HttpOnly token cookie exists,
 * and require state-changing requests to echo it in the `x-csrf-token` header.
 * Same-site + SameSite=Lax session cookies already block most CSRF; this is defence in depth.
 */
export function csrf(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      httpOnly: false, // the client must read it to echo it back
      // Shared across *.taj.works (split client/API subdomains) so the client JS can read it.
      domain: env.COOKIE_DOMAIN || undefined,
      path: "/",
    });
  }
  if (SAFE.has(req.method)) return next();
  const header = req.get("x-csrf-token");
  if (!header || header !== token) return next(Errors.forbidden("Invalid CSRF token"));
  next();
}
