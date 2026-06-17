import type { NextFunction, Request, Response } from "express";
import { asyncHandler, Errors } from "../lib/errors.js";
import { env } from "../config/env.js";
import { can, type Permission } from "../rbac/policy.js";
import type { Resource } from "../rbac/types.js";
import { loadAuthContext } from "../modules/auth/auth.service.js";

const ABSOLUTE_MS = env.SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000;

/** Pure: has a session exceeded its absolute lifetime (independent of the idle window)? */
export function sessionExpired(loginAt: number | undefined, now: number, absoluteMs: number = ABSOLUTE_MS): boolean {
  return typeof loginAt === "number" && now - loginAt > absoluteMs;
}

/**
 * Absolute-timeout gate: destroys a session past its hard lifetime and continues as
 * anonymous (downstream requireAuth then returns 401). Complements the rolling idle window.
 */
export function enforceAbsoluteTimeout(req: Request, res: Response, next: NextFunction): void {
  if (req.session && sessionExpired(req.session.loginAt, Date.now())) {
    (req as { user?: unknown }).user = undefined;
    req.session.destroy(() => {
      res.clearCookie("forge.sid");
      next();
    });
    return;
  }
  next();
}

/** Load the fresh AuthContext once per request from the session's user id. */
export const attachAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const sessionUser = req.user as { id: string } | undefined;
  if (sessionUser?.id && !req.auth) {
    req.auth = (await loadAuthContext(sessionUser.id)) ?? undefined;
  }
  next();
});

/** Gate: require an authenticated user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) return next(Errors.unauthorized());
  next();
}

/**
 * Gate: require a permission, optionally for a specific resource (for scope checks).
 * `resourceFrom` derives the resource (domain/team/owner) from the request.
 */
export function requirePermission(
  action: Permission,
  resourceFrom?: (req: Request) => Resource | undefined,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(Errors.unauthorized());
    const resource = resourceFrom?.(req);
    if (!can(req.auth, action, resource)) return next(Errors.forbidden());
    next();
  };
}
