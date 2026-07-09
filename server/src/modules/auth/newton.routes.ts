import { Router, type Request, type Response, type NextFunction } from "express";
import { requestData, applyCookies } from "newton-auth/http";
import { env, newtonConfigured } from "../../config/env.js";
import { authRateLimit } from "../../middleware/security.js";
import { asyncHandler } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { newtonAuth } from "../../lib/newton-auth.js";
import { resolveNewtonLogin } from "./auth.service.js";

/**
 * Newton School login. Mounted at the app ROOT (/newton/*), NOT under /api, to match the
 * Newton-registered redirect URI. We use the SDK core to verify identity, then establish
 * Forge's OWN Redis session (req.login) — so RBAC, CSRF, audit, and timeouts are unchanged.
 * These are top-level GET navigations (CSRF middleware only guards state-changing methods).
 */
export const newtonRouter = Router();
const CLIENT = env.APP_BASE_URL;

/** Begin Newton login: redirect the browser to Newton, dropping the SDK state cookie. */
newtonRouter.get("/login", authRateLimit, (req: Request, res: Response) => {
  if (!newtonConfigured || !newtonAuth) {
    return res.redirect(`${CLIENT}/login?error=oauth_unconfigured`);
  }
  const next = typeof req.query.next === "string" && req.query.next ? req.query.next : "/";
  try {
    newtonAuth.validateLoginRedirectTarget(next);
    const { location, stateCookie } = newtonAuth.buildLoginRedirect(requestData(req), next);
    applyCookies(res, [stateCookie]);
    res.redirect(302, location);
  } catch {
    res.redirect(`${CLIENT}/login?error=denied`);
  }
});

/**
 * Newton callback: verify the assertion, map to the allowlisted Forge user, and mint the
 * Forge session. authenticated=false (no Newton account) → a clean error screen.
 */
newtonRouter.get(
  "/callback",
  authRateLimit,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!newtonConfigured || !newtonAuth) {
      return res.redirect(`${CLIENT}/login?error=oauth_unconfigured`);
    }

    let result;
    try {
      result = await newtonAuth.handleCallback(requestData(req));
    } catch {
      return res.redirect(`${CLIENT}/login?error=denied`);
    }
    applyCookies(res, [result.clearStateCookie]); // always clear the one-shot state cookie

    if (!result.authenticated || !result.user) {
      return res.redirect(`${CLIENT}/login?error=no_newton_account`);
    }

    let userId: string;
    try {
      userId = await resolveNewtonLogin({
        uid: result.user.uid,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        authorized: result.user.authorized,
      });
    } catch (err) {
      logger.warn({ err }, "newton login rejected (not provisioned / not active)");
      return res.redirect(`${CLIENT}/login?error=denied`);
    }

    // Establish Forge's own session — passport serializes only the user id.
    req.login({ id: userId }, (err) => {
      if (err) return next(err);
      req.session.loginAt = Date.now(); // anchor the absolute-timeout window
      res.redirect(`${CLIENT}/`);
    });
  }),
);
