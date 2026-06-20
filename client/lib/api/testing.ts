/**
 * Testing Portal data seam (browser-only — the store is a client hook).
 *
 * In presentation mode every call is a no-op: the store's localStorage IS the source of
 * truth, so the portal works with zero backend. In production these best-effort sync to the
 * Express Testing API (`/api/testing/*`, tester-allowlist gated server-side). Sync failures
 * never block the UI — localStorage stays authoritative for responsiveness.
 */
import type { DomainKey, DomainStatus, Severity } from "@/lib/mock/testing";
import { csrfHeaders } from "./csrf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
export const TESTING_PRESENTATION =
  (process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "presentation") === "presentation";

/** Map the store's lowercase UI status to the server enum. */
const STATUS_TO_SERVER: Record<DomainStatus, string> = {
  not_started: "NOT_STARTED",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
};

export interface SaveProgressBody {
  status: DomainStatus;
  done: string[];
  skipped: string[];
  current: number;
}
export interface ReportIssueBody {
  domainKey: DomainKey;
  stepId?: string;
  title: string;
  description?: string;
  severity: Severity;
}

/** Browser GET against the Testing API; throws on non-2xx (the store handles failures). */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export interface Whoami { email: string; name: string | null; role: string | null; isTester: boolean; isAdmin: boolean }
export interface ProgressRow { domainKey: DomainKey; status: ReportStatus; done: string[]; skipped: string[]; current: number }
export interface DomainEnvironmentDto {
  provisioned: boolean;
  teachers: string[]; mentors: string[]; students: string[];
  teams: string[]; repositories: string[]; milestones: string[]; deliverables: string[];
}

export interface PlanStepDto { id: string; group: string; role: string; title: string; instruction: string; expected: string; success: string }
export interface PlanDto { domainKey: DomainKey; name: string; model: string; steps: PlanStepDto[] }

/** Production loaders — used by the server-backed store (no localStorage, no mock in prod). */
export const fetchWhoami = () => getJson<Whoami>("/testing/whoami");
export const fetchPlans = () => getJson<{ items: PlanDto[] }>("/testing/plans").then((r) => r.items);
export const fetchProgressRows = () => getJson<{ items: ProgressRow[] }>("/testing/progress").then((r) => r.items);
export const fetchIssueRows = () => getJson<{ items: ReportIssueRow[] }>("/testing/issues").then((r) => r.items);
export const fetchEnvironment = (domain: DomainKey) => getJson<DomainEnvironmentDto>(`/testing/environment/${domain}`);

async function send(path: string, method: "PUT" | "POST", body: unknown): Promise<void> {
  if (TESTING_PRESENTATION) return;
  const doFetch = async (force = false) =>
    fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: { "content-type": "application/json", ...(await csrfHeaders(force)) },
      body: JSON.stringify(body),
    });
  try {
    let res = await doFetch();
    if (res.status === 403) res = await doFetch(true); // refresh CSRF + retry once
    if (!res.ok) {
      // Best-effort, but surface failures (e.g. validation 400) instead of swallowing them.
      // eslint-disable-next-line no-console
      console.warn(`[testing] ${method} ${path} → ${res.status}`, await res.text().catch(() => ""));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[testing] ${method} ${path} failed`, e);
  }
}

/** Persist one domain's progress server-side (production only). */
export function syncProgress(domain: DomainKey, body: SaveProgressBody): Promise<void> {
  return send(`/testing/progress/${domain}`, "PUT", {
    status: STATUS_TO_SERVER[body.status],
    done: body.done,
    skipped: body.skipped,
    current: body.current,
  });
}

export interface ProvisionedMember { email: string; role: string; created: boolean; invited: boolean }
export interface ProvisionResult {
  ok: boolean;
  status?: number;
  message?: string;
  data?: { domain: string; teamId: string; members: ProvisionedMember[] };
}

/**
 * Start Testing provisioning. Presentation → no-op simulation (nothing is created). Production
 * → POST the provision endpoint, which creates the tester accounts with their real roles and
 * emails Google-OAuth invites (Testing Admin only; a non-admin caller gets a 403 surfaced here).
 */
export async function provisionDomain(domain: DomainKey): Promise<ProvisionResult> {
  if (TESTING_PRESENTATION) return { ok: true }; // simulation — no DB writes, no emails
  const doFetch = async (force = false) =>
    fetch(`${API_BASE}/testing/provision/${domain}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(await csrfHeaders(force)) },
      body: "{}",
    });
  try {
    let res = await doFetch();
    // A 403 may be a stale CSRF token rather than the admin gate — refresh + retry once.
    if (res.status === 403) res = await doFetch(true);
    if (!res.ok) {
      const reason = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      return {
        ok: false,
        status: res.status,
        message: res.status === 403
          // After a CSRF retry, a real 403 is the admin gate (the server says so).
          ? (reason?.error?.message ?? "Only the Testing Admin can provision a domain — ask them to start it.")
          : `Provisioning failed (${res.status}).`,
      };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, message: "Could not reach the server to provision the environment." };
  }
}

export type ReportStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export interface ReportSummaryRow { domainKey: DomainKey; status: ReportStatus; issues: number; updatedAt: string | null }
export interface ReportIssueRow {
  id: string; testerEmail: string; domainKey: DomainKey; stepId: string | null;
  title: string; description: string | null; severity: string; createdAt: string;
}
export interface TestingReport { admin: boolean; summary: ReportSummaryRow[]; issues: ReportIssueRow[] }
export interface ReportResult { ok: boolean; status?: number; message?: string; data?: TestingReport }

/**
 * Fetch the persistent testing report (production only). Presentation returns `{ ok:true }`
 * with no data — the caller falls back to the localStorage store. Production GETs `/report`
 * (per-domain status + issues that survive teardown; admin sees all, others their own).
 */
export async function fetchReport(): Promise<ReportResult> {
  if (TESTING_PRESENTATION) return { ok: true };
  try {
    const res = await fetch(`${API_BASE}/testing/report`, { credentials: "include" });
    if (!res.ok) {
      return { ok: false, status: res.status, message: `Could not load the report (${res.status}).` };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, message: "Could not reach the server to load the report." };
  }
}

export interface EndResult { ok: boolean; status?: number; message?: string; data?: { removedUsers: number; removedTeams: number } }

/**
 * End Testing — tear down the active domain's provisioned environment (delete the tester
 * accounts + their data, keeping Shaik/LCC and the testing report). Presentation → no-op
 * simulation. Production → Testing Admin only (a non-admin caller gets a 403 surfaced here).
 */
export async function endTesting(): Promise<EndResult> {
  if (TESTING_PRESENTATION) return { ok: true }; // simulation — nothing to clear
  const doFetch = async (force = false) =>
    fetch(`${API_BASE}/testing/teardown`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(await csrfHeaders(force)) },
      body: "{}",
    });
  try {
    let res = await doFetch();
    if (res.status === 403) res = await doFetch(true); // refresh CSRF + retry once
    if (!res.ok) {
      const reason = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      return {
        ok: false,
        status: res.status,
        message: res.status === 403
          ? (reason?.error?.message ?? "Only the Testing Admin can end testing.")
          : `End testing failed (${res.status}).`,
      };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, message: "Could not reach the server to end testing." };
  }
}

/** Record + email an issue server-side (production only); emails the Testing Admin. */
export function syncIssue(body: ReportIssueBody): Promise<void> {
  return send(`/testing/issues`, "POST", {
    domainKey: body.domainKey,
    stepId: body.stepId,
    title: body.title,
    description: body.description,
    // Server expects the uppercase enum (LOW/MEDIUM/HIGH/CRITICAL); the UI uses "Medium".
    severity: body.severity.toUpperCase(),
  });
}
