import { cookies } from "next/headers";
import type { AuthUser, RoleKey, Scope } from "@/lib/types";

/**
 * PHASE 1 ONLY — dev session resolution by cookie (no real auth yet).
 * The TopNav Role Switcher sets `forge_role`; this returns a representative
 * AuthUser for that role so every dashboard is previewable.
 * Phase 3 replaces this with Auth.js `auth()` returning the real session.
 */

const ROLE_COOKIE = "forge_role";

export const DEV_USERS: Record<RoleKey, AuthUser> = {
  ADMIN: {
    id: "us1", fullName: "Patrick Admin", email: "patrick@maverick.biz",
    role: "ADMIN", scopes: [{ type: "GLOBAL" }], avatarColor: "#4f46e5",
  },
  LCC: {
    id: "us2", fullName: "Priya Sharma", email: "priya.lcc@nst.edu",
    role: "LCC", scopes: [{ type: "GLOBAL" }], avatarColor: "#0891b2",
  },
  TEACHER: {
    id: "us3", fullName: "Bipul Kumar", email: "bipul@nst.edu",
    role: "TEACHER", domainId: "d-ai",
    // Demo teacher spans two domains (AI + ML) to exercise the multi-domain UI.
    domainKeys: ["AI", "ML"],
    scopes: [{ type: "DOMAIN", id: "d-ai" } as Scope, { type: "DOMAIN", id: "d-ml" } as Scope],
    avatarColor: "#7c3aed",
  },
  MENTOR: {
    id: "us5", fullName: "Aryan Sharma", email: "aryan@nst.edu",
    role: "MENTOR", domainId: "d-ai", teamId: "t-ai-07",
    scopes: [{ type: "TEAM", id: "t-ai-07" } as Scope], avatarColor: "#059669",
  },
  MENTEE: {
    id: "us7", fullName: "Sneha Iyer", email: "sneha@nst.edu",
    role: "MENTEE", domainId: "d-ai", teamId: "t-ai-07",
    scopes: [{ type: "SELF" }], avatarColor: "#e11d48",
  },
};

const VALID: RoleKey[] = ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"];

export async function getCurrentRole(): Promise<RoleKey> {
  const store = await cookies();
  const v = store.get(ROLE_COOKIE)?.value as RoleKey | undefined;
  return v && VALID.includes(v) ? v : "MENTEE";
}

export async function getCurrentUser(): Promise<AuthUser> {
  const role = await getCurrentRole();
  return DEV_USERS[role];
}

export const ROLE_COOKIE_NAME = ROLE_COOKIE;
