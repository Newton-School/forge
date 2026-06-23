import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, RoleKey, Scope, ScopeType } from "@/lib/types";
import { type DomainKey, DOMAIN_KEYS, DOMAIN_COOKIE_NAME } from "@/lib/presentation";
import { serverOrigin } from "@/lib/server-origin";
import { isPresentationMode } from "@/lib/config";

/**
 * Session resolution. In **presentation** mode it's the dev cookie switcher (a
 * representative AuthUser per role, every dashboard previewable). In **production** it
 * reads the real server session via `/api/auth/me` (the session cookie is first-party
 * thanks to the same-origin API proxy — see next.config) and unauthenticated visitors are
 * redirected out of the app shell to the public landing page.
 */
const PRESENTATION = isPresentationMode();
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

/** Real per-user integration status from the server (production only; null in presentation/offline). */
export interface ConnectionsStatus {
  github: { connected: boolean; username: string | null; connectedAt: string | null; configured: boolean };
  discord: { connected: boolean; username: string | null; configured: boolean };
  repo: { mode: "org" | "shared" | "per_student"; canConnect: boolean; teamId: string | null; url: string | null; name: string | null; orgMode: boolean };
  calendar: { mode: "inapp" };
}

export async function getConnections(): Promise<ConnectionsStatus | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/connections`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ConnectionsStatus;
  } catch {
    return null;
  }
}

/** Real AI-org GitHub analytics (production only; null in presentation/offline → caller falls back to mock). */
export interface OrgAnalytics {
  login: string;
  name: string | null;
  repos: number;
  teams: number;
  projects: number;
  contributors: number;
  commits: number;
  openIssues: number;
  closedIssues: number;
  prs: number;
  mergedPrs: number;
  openPrs: number;
  teamRows: {
    repo: string; fullName: string; project: string; teamIndex: number; description: string | null;
    commits: number; contributors: number; openIssues: number; closedIssues: number;
    prs: number; mergedPrs: number; openPrs: number;
  }[];
}

export async function getOrgAnalytics(): Promise<OrgAnalytics | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/github/org/analytics`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OrgAnalytics;
  } catch {
    return null;
  }
}

/** Real detail for one AI-org repo (production only; null → caller falls back to mock / notFound). */
export interface RepoDetailLiveDto {
  repo: string;
  issues: { number: number; title: string; state: string; labels: string[]; author: string | null; assignees: string[]; milestone: string | null; url: string; createdAt: string }[];
  pulls: { number: number; title: string; state: string; author: string | null; additions: number; deletions: number; url: string; createdAt: string; mergedAt: string | null }[];
  milestones: { number: number; title: string; state: string; progress: number; dueAt: string | null }[];
  commits: number;
  commitList: { sha: string; message: string; author: string | null; date: string | null }[];
  contributors: string[];
}

export async function getRepoDetail(repo: string): Promise<RepoDetailLiveDto | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/github/repos/${encodeURIComponent(repo)}`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RepoDetailLiveDto;
  } catch {
    return null;
  }
}

/** Real org-wide per-contributor leaderboard (production only; null → caller falls back to mock). */
export interface OrgContributor {
  login: string; commits: number; issuesOpened: number; prsRaised: number; prsMerged: number; repos: number; acceptanceRate: number;
}

export async function getOrgContributors(): Promise<OrgContributor[] | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/github/org/contributors`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { items: OrgContributor[] }).items;
  } catch {
    return null;
  }
}

/** Real org roster (mentor + students per team-repo) from GitHub Teams (production only). */
export interface OrgRoster {
  source: "github" | "derived";
  reason?: string;
  faculty: string[];
  teams: { slug: string; name: string; repo: string | null; repos: string[]; mentor: string | null; mentors: string[]; students: string[] }[];
}

export async function getOrgRoster(): Promise<OrgRoster | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/github/teams`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { items: OrgRoster }).items;
  } catch {
    return null;
  }
}

/** The caller's OWN repo in AI org-mode (resolved via their GitHub login + roster). */
export interface MyOrgRepo {
  repo: string | null;
  role: "mentor" | "student" | null;
  team: string | null;
  login: string | null;
}

export async function getMyOrgRepo(): Promise<MyOrgRepo | null> {
  if (PRESENTATION) return null;
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${SERVER_ORIGIN}/api/integrations/github/org/mine`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MyOrgRepo;
  } catch {
    return null;
  }
}

export const ROLE_COOKIE_NAME = ROLE_COOKIE;

/** Active preview domain from the `forge_domain` cookie (server-only). Defaults to AI. */
export async function getActiveDomain(): Promise<DomainKey> {
  const store = await cookies();
  const v = store.get(DOMAIN_COOKIE_NAME)?.value as DomainKey | undefined;
  return v && DOMAIN_KEYS.includes(v) ? v : "AI";
}
