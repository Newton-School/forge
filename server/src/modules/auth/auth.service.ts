import { prisma } from "../../lib/db.js";
import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import type { AuthContext, RoleGrant, RoleKey, ScopeType } from "../../rbac/types.js";
import { hostedDomainAllowed } from "./auth.gate.js";
import { completeForUser } from "../invitations/invitations.service.js";

export { hostedDomainAllowed };

export interface GoogleProfileLite {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string;
}

/**
 * Resolve a Google login into a Forge user id, or throw 403.
 * Gate = hosted-domain AND the email already exists (admin allowlist). No signup.
 */
export async function resolveGoogleLogin(p: GoogleProfileLite): Promise<string> {
  if (!hostedDomainAllowed(p.email, p.hd, env.ALLOWED_HOSTED_DOMAIN)) {
    throw Errors.forbidden("Account domain is not allowed");
  }
  const email = p.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Errors.forbidden("This email is not provisioned for Forge");
  if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
    throw Errors.forbidden("Account is not active");
  }
  const wasInvited = user.status === "INVITED";
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      googleSub: user.googleSub ?? p.sub,
      avatarUrl: p.picture ?? user.avatarUrl,
      status: wasInvited ? "ACTIVE" : user.status,
      lastLoginAt: new Date(),
    },
  });
  // First successful sign-in completes the onboarding invitation (best-effort).
  if (wasInvited) await completeForUser(updated.id).catch(() => undefined);
  return updated.id;
}

/** Load the fresh authorization context for a user id (roles included). */
export async function loadAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
  if (!user || user.status === "SUSPENDED" || user.status === "DEACTIVATED") return null;
  const roles: RoleGrant[] = user.roles.map((r) => ({
    role: r.role as RoleKey,
    scopeType: r.scopeType as ScopeType,
    scopeId: r.scopeId ?? null,
  }));
  return { id: user.id, email: user.email, fullName: user.fullName, roles };
}
