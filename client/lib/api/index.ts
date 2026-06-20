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
import { fetchJson } from "./fetch";
import { graphTeamToRepoTeam, type DomainTeamsDto, type GraphTeamDto } from "./github-repo-live";
import {
  userDtoToMock, auditDtoToMock, invitationDtoToMock, domainDtoToMock, teamDtoToMock, taskDtoToMock,
  updateDtoToMock, weeklyReviewDtoToMock, deliverableDtoToMock, milestoneDtoToMock, concernDtoToMock,
  menteeDtoToMock, notificationDtoToMock, calendarEventDtoToMock, githubActivityDtoToMock, demeritDtoToMock,
  emailTemplateDtoToMock,
  type UserDto, type AuditDto, type InvitationDto, type DomainDto, type TeamDto, type TaskDto,
  type UpdateDto, type WeeklyReviewDto, type DeliverableDto, type MilestoneDto, type ConcernDto,
  type MenteeDto, type NotificationDto, type CalendarEventDto, type GithubActivityDto, type DemeritDto,
  type EmailTemplateDto,
} from "./mappers";
export type { MockDemerit } from "./mappers";

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
 * Team-first GitHub accessors. Presentation → the mock selectors; production → the live
 * `/domain-teams`, `/teams/:id/graph`, and per-repo dashboard endpoints (summaries at the
 * grid, full live data at the repo detail). One swap point, both modes share the views.
 */
export async function repoDomainTeams(domain: string): Promise<repoMock.RepoTeam[]> {
  if (PRESENTATION) return repoMock.teamsForDomain(domain);
  const dto = await fetchJson<DomainTeamsDto>(`/integrations/github/domain-teams?domain=${encodeURIComponent(domain)}`);
  return dto.teams.map(graphTeamToRepoTeam);
}

export async function repoTeamGraph(teamId: string): Promise<repoMock.RepoTeam | null> {
  if (PRESENTATION) return repoMock.teamById(teamId) ?? null;
  try {
    const dto = await fetchJson<GraphTeamDto>(`/integrations/github/teams/${teamId}/graph`);
    return graphTeamToRepoTeam(dto);
  } catch {
    return null;
  }
}

export async function repoTeamRepoDashboard(teamId: string, repoName: string): Promise<repoMock.RepoConnection | null> {
  if (PRESENTATION) {
    const team = repoMock.teamById(teamId);
    return team ? repoMock.teamRepoByName(team, repoName) ?? null : null;
  }
  try {
    const dto = await fetchJson<repoMock.RepoDashboardDto>(`/integrations/github/teams/${teamId}/repos/${encodeURIComponent(repoName)}/dashboard`);
    return repoMock.dashboardDtoToConnection(dto, { domain: dto.team?.domainKey ?? "" });
  } catch {
    return null;
  }
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

export interface RaiseConcernInput {
  title: string;
  description: string;
  category: string;
  severity: string;
  anonymous?: boolean;
}

/** Raise a concern — creates the tracked ticket and emails the LCC server-side. */
export async function raiseConcern(input: RaiseConcernInput): Promise<{ id: string }> {
  if (PRESENTATION) return { id: "demo-concern" }; // demo mode: no backend write
  return apiMutate<{ id: string }>("/concerns", "POST", input);
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
  domains: async (): Promise<fixtures.MockDomain[]> => {
    if (PRESENTATION) return fixtures.DOMAINS;
    const { items } = await fetchJson<{ items: DomainDto[] }>("/analytics/domains");
    return items.map(domainDtoToMock);
  },
  teams: async (): Promise<fixtures.MockTeam[]> => {
    if (PRESENTATION) return fixtures.TEAMS;
    const { items } = await fetchJson<{ items: TeamDto[] }>("/analytics/teams");
    return items.map(teamDtoToMock);
  },
  mentees: async (): Promise<fixtures.MockMentee[]> => {
    if (PRESENTATION) return fixtures.MENTEES;
    const { items } = await fetchJson<{ items: MenteeDto[] }>("/reviews/mentees");
    return items.map(menteeDtoToMock);
  },
  updates: async (): Promise<fixtures.MockUpdate[]> => {
    if (PRESENTATION) return fixtures.UPDATES;
    const { items } = await fetchJson<{ items: UpdateDto[] }>("/reviews/updates?take=500");
    return items.map(updateDtoToMock);
  },
  weeklyReviews: async (): Promise<fixtures.MockWeeklyReview[]> => {
    if (PRESENTATION) return fixtures.WEEKLY_REVIEWS;
    const { items } = await fetchJson<{ items: WeeklyReviewDto[] }>("/reviews/weekly?take=500");
    return items.map(weeklyReviewDtoToMock);
  },
  concerns: async (): Promise<fixtures.MockConcern[]> => {
    if (PRESENTATION) return fixtures.CONCERNS;
    const { items } = await fetchJson<{ items: ConcernDto[] }>("/concerns?take=300");
    return items.map(concernDtoToMock);
  },
  tasks: async (): Promise<fixtures.MockTask[]> => {
    if (PRESENTATION) return fixtures.TASKS;
    const { items } = await fetchJson<{ items: TaskDto[] }>("/tasks?take=500");
    return items.map(taskDtoToMock);
  },
  milestones: async (): Promise<fixtures.MockMilestone[]> => {
    if (PRESENTATION) return fixtures.MILESTONES;
    const { items } = await fetchJson<{ items: MilestoneDto[] }>("/milestones?take=300");
    return items.map(milestoneDtoToMock);
  },
  deliverables: async (): Promise<fixtures.MockDeliverable[]> => {
    if (PRESENTATION) return fixtures.DELIVERABLES;
    const { items } = await fetchJson<{ items: DeliverableDto[] }>("/deliverables?take=300");
    return items.map(deliverableDtoToMock);
  },
  // Admin + users + auth slice — real endpoints + DTO→UI mappers (see ./mappers).
  users: async (): Promise<fixtures.MockUser[]> => {
    if (PRESENTATION) return fixtures.USERS;
    const { items } = await fetchJson<{ items: UserDto[] }>("/users?take=200");
    return items.map(userDtoToMock);
  },
  auditLogs: async (): Promise<fixtures.MockAudit[]> => {
    if (PRESENTATION) return fixtures.AUDIT_LOGS;
    const { items } = await fetchJson<{ items: AuditDto[] }>("/audit?take=100");
    return items.map(auditDtoToMock);
  },
  invitations: async (): Promise<fixtures.MockInvitation[]> => {
    if (PRESENTATION) return fixtures.INVITATIONS;
    const { items } = await fetchJson<{ items: InvitationDto[] }>("/invitations?take=200");
    return items.map(invitationDtoToMock);
  },
  githubActivity: async (): Promise<fixtures.MockGithub[]> => {
    if (PRESENTATION) return fixtures.GITHUB_ACTIVITY;
    const { items } = await fetchJson<{ items: GithubActivityDto[] }>("/integrations/github/activity?take=50");
    return items.map(githubActivityDtoToMock);
  },
  calendar: async (): Promise<fixtures.MockCalendar[]> => {
    if (PRESENTATION) return fixtures.CALENDAR;
    const { items } = await fetchJson<{ items: CalendarEventDto[] }>("/calendar/events");
    return items.map(calendarEventDtoToMock);
  },
  notifications: async (): Promise<fixtures.MockNotification[]> => {
    if (PRESENTATION) return fixtures.NOTIFICATIONS;
    const { items } = await fetchJson<{ items: NotificationDto[] }>("/notifications?take=50");
    return items.map(notificationDtoToMock);
  },
  emailTemplates: async (): Promise<fixtures.MockTemplate[]> => {
    if (PRESENTATION) return fixtures.EMAIL_TEMPLATES;
    const { items } = await fetchJson<{ items: EmailTemplateDto[] }>("/email/templates");
    return items.map(emailTemplateDtoToMock);
  },
  demerits: async () => {
    if (PRESENTATION) return fixtures.DEMERITS;
    const { items } = await fetchJson<{ items: DemeritDto[] }>("/demerits?take=200");
    return items.map(demeritDtoToMock);
  },
  driveHealth: async (): Promise<typeof fixtures.DRIVE_HEALTH> => {
    if (PRESENTATION) return fixtures.DRIVE_HEALTH;
    const { health } = await fetchJson<{ health: typeof fixtures.DRIVE_HEALTH }>("/analytics/overview");
    return health;
  },
};
