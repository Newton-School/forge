import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, RoleKey, Scope, ScopeType } from "@/lib/types";
import { type DomainKey, DOMAIN_KEYS, DOMAIN_COOKIE_NAME } from "@/lib/presentation";
import { serverOrigin } from "@/lib/server-origin";

/**
 * Session resolution. In **presentation** mode it's the dev cookie switcher (a
 * representative AuthUser per role, every dashboard previewable). In **production** it
 * reads the real server session via `/api/auth/me` (the session cookie is first-party
 * thanks to the same-origin API proxy — see next.config) and unauthenticated visitors are
 * redirected out of the app shell to the public landing page.
 */
const PRESENTATION =
  (process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "presentation") === "presentation";
/** Backend origin for the server-side session check (API_PROXY_TARGET, else derived from NEXT_PUBLIC_API_URL). */
const SERVER_ORIGIN = serverOrigin();

const ROLE_COOKIE = "forge_role";

const ROLE_RANK: Record<string, number> = { ADMIN: 4, LCC: 3, TEACHER: 2, MENTOR: 1, MENTEE: 0 };
interface ServerSessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: { role: string; scopeType: string; scopeId: string | null }[];
}

/** Map the server's AuthContext (`/auth/me`) to the UI AuthUser the shell expects. */
function toAuthUser(su: ServerSessionUser): AuthUser {
  const roles = su.roles.length ? su.roles : [{ role: "MENTEE", scopeType: "SELF", scopeId: null }];
  const primary = [...roles].sort((a, b) => (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0))[0]!;
  const scopes: Scope[] = roles.map((r) => ({ type: r.scopeType as ScopeType, id: r.scopeId ?? undefined }));
  return {
    id: su.id,
    fullName: su.fullName,
    email: su.email,
    role: primary.role as RoleKey,
    scopes,
    domainId: roles.find((r) => r.scopeType === "DOMAIN")?.scopeId ?? undefined,
    teamId: roles.find((r) => r.scopeType === "TEAM")?.scopeId ?? undefined,
  };
}

/** Read the real server session, forwarding the (first-party) cookies. Null if signed out. */
async function fetchServerUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const hasSession = store.getAll().some((c) => c.name === "forge.sid");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/auth/me`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[session] /auth/me ${res.status} via ${SERVER_ORIGIN} (forge.sid forwarded: ${hasSession})`);
      return null;
    }
    const data = (await res.json()) as { user?: ServerSessionUser };
    return data.user ? toAuthUser(data.user) : null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[session] /auth/me fetch to ${SERVER_ORIGIN} failed (forge.sid present: ${hasSession})`, e);
    return null;
  }
}

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

/** The signed-in user, or null if signed out. Presentation → the dev role user. */
export async function getOptionalUser(): Promise<AuthUser | null> {
  if (!PRESENTATION) return fetchServerUser();
  return DEV_USERS[await getCurrentRole()];
}

/**
 * The signed-in user for the app shell. In production an unauthenticated visitor is
 * redirected to the public landing page (so the dashboards are never shown signed-out).
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/landing");
  return user;
}

export const isPresentation = PRESENTATION;

export const ROLE_COOKIE_NAME = ROLE_COOKIE;

/** Active preview domain from the `forge_domain` cookie (server-only). Defaults to AI. */
export async function getActiveDomain(): Promise<DomainKey> {
  const store = await cookies();
  const v = store.get(DOMAIN_COOKIE_NAME)?.value as DomainKey | undefined;
  return v && DOMAIN_KEYS.includes(v) ? v : "AI";
}
