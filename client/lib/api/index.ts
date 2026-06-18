/**
 * Data-access layer — the ONLY module allowed to import the data source.
 *
 * Pages and components depend on `@/lib/api`, never on `@/lib/mock/data` directly
 * (Dependency Inversion: depend on this abstraction, not the concrete source).
 * That makes the mock → live-API swap a change in ONE place, not 40+ files.
 *
 * Two surfaces:
 *  1. The typed fixtures + types are re-exported for the current synchronous reads
 *     (presentation mode). Nothing outside this folder imports the mock module.
 *  2. `api.*` async accessors are the forward-looking interface: in presentation
 *     mode they resolve the fixtures; otherwise they fetch the Express API. Phase 2
 *     migrates pages from the synchronous fixtures to these accessors.
 */
import * as fixtures from "@/lib/mock/data";
import * as repoMock from "@/lib/mock/github-repo";
import { fetchRetry } from "@/lib/http";

// (1) Synchronous fixtures + all Mock* types — the single re-export seam.
export * from "@/lib/mock/data";
// AI Domain — GitHub-as-source-of-truth fixtures + derived analytics selectors.
export * from "@/lib/mock/github";
// ML/DVA/SDSE — repository-based GitHub mode (owner + collaborators, no org).
export * from "@/lib/mock/github-repo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
// Demo mode is on unless explicitly disabled (NEXT_PUBLIC_* so it reaches the browser).
const PRESENTATION =
  (process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "presentation") === "presentation";

/**
 * Typed GET against the backend; falls back to the fixture in presentation mode.
 * Reads are idempotent, so they go through `fetchRetry` (timeout + exponential backoff).
 */
async function get<T>(path: string, fixture: T): Promise<T> {
  if (PRESENTATION) return fixture;
  const res = await fetchRetry(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Repository-mode dashboard (ML/DVA/SDSE). Presentation → the mock for that domain;
 * production → the live team endpoint, mapped to the same `RepoConnection` shape the
 * views render. Returns null when no repo is connected.
 */
export async function repoDashboard(opts: {
  domain: string;
  teamId?: string;
  selfLogin?: string;
}): Promise<repoMock.RepoConnection | null> {
  if (PRESENTATION) return repoMock.repoConnectionFor(opts.domain) ?? null;
  if (!opts.teamId) return null;
  const res = await fetchRetry(`${API_BASE}/integrations/github/teams/${opts.teamId}/repo/dashboard`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`repoDashboard → ${res.status}`);
  const dto = (await res.json()) as repoMock.RepoDashboardDto;
  return repoMock.dashboardDtoToConnection(dto, { domain: opts.domain, selfLogin: opts.selfLogin });
}

/**
 * Forward-looking async data accessors. Server components: `const teams = await api.teams()`.
 * Today they return fixtures; Phase 2 flips PRESENTATION off and they hit the API —
 * with no change to call sites.
 */
/** Read the CSRF token cookie (set by the server) for state-changing requests. */
function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith("forge_csrf="))?.split("=")[1];
}

/** Mutating request helper (POST/PATCH/DELETE) — sends cookies + CSRF header. */
export async function apiMutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json", ...(csrfToken() ? { "x-csrf-token": csrfToken()! } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(err?.error?.message ?? `${method} ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: { role: string; scopeType: string; scopeId: string | null }[];
}

/** The current session user, or null if not signed in. (Real auth — Phase 2.) */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (PRESENTATION) return null;
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`auth/me → ${res.status}`);
  return ((await res.json()) as { user: SessionUser }).user;
}

export async function logout(): Promise<void> {
  await apiMutate("/auth/logout", "POST");
}

/**
 * Presentation-safe mutation for UI buttons. In demo mode it resolves without
 * hitting a backend (so the demo "works"); in production it POSTs to the API
 * with CSRF. Returns the parsed response (or a stub in demo mode).
 */
export async function submit<T = { ok: true }>(path: string, method: string, body?: unknown): Promise<T> {
  if (PRESENTATION) return { ok: true } as T;
  return apiMutate<T>(path, method, body);
}

export const api = {
  domains: () => get("/domains", fixtures.DOMAINS),
  teams: () => get("/teams", fixtures.TEAMS),
  mentees: () => get("/mentees", fixtures.MENTEES),
  updates: () => get("/updates", fixtures.UPDATES),
  weeklyReviews: () => get("/weekly-reviews", fixtures.WEEKLY_REVIEWS),
  concerns: () => get("/concerns", fixtures.CONCERNS),
  tasks: () => get("/tasks", fixtures.TASKS),
  milestones: () => get("/milestones", fixtures.MILESTONES),
  deliverables: () => get("/deliverables", fixtures.DELIVERABLES),
  users: () => get("/users", fixtures.USERS),
  githubActivity: () => get("/integrations/github/activity", fixtures.GITHUB_ACTIVITY),
  calendar: () => get("/calendar", fixtures.CALENDAR),
  notifications: () => get("/notifications", fixtures.NOTIFICATIONS),
  emailTemplates: () => get("/email-templates", fixtures.EMAIL_TEMPLATES),
  auditLogs: () => get("/audit-logs", fixtures.AUDIT_LOGS),
  demerits: () => get("/demerits", fixtures.DEMERITS),
  driveHealth: () => get("/analytics/drive-health", fixtures.DRIVE_HEALTH),
};
