"use client";

/**
 * Tester progress store with two backends, chosen by APP_MODE:
 *
 *  - **Presentation** — localStorage. Mock data, no backend; progress persists locally so a
 *    tester can Resume across reloads. The dev "switch tester" control is available.
 *  - **Production** — the Express Testing API (Postgres). NO localStorage, NO mock: identity,
 *    progress and issues all load from / write through to the server. The acting tester is the
 *    logged-in user (no switching).
 *
 * The hook surface is identical for both so components don't care which backend is live.
 */
import * as React from "react";
import {
  DOMAIN_KEYS, TESTERS, type DomainKey, type DomainStatus, type Severity,
} from "@/lib/mock/testing";
import {
  TESTING_PRESENTATION, syncProgress, syncIssue,
  fetchWhoami, fetchProgressRows, fetchIssueRows,
} from "@/lib/api/testing";

export interface ReportedIssue {
  stepId: string;
  title: string;
  description: string;
  severity: Severity;
  at: string;
}
export interface DomainProgress {
  done: string[]; // step ids
  skipped: string[]; // step ids
  current: number; // active step index
  issues: ReportedIssue[];
}
export interface TestingState {
  tester: string; // acting tester email
  domains: Record<DomainKey, DomainProgress>;
}

const KEY = "forge_testing_progress_v1";

const emptyDomain = (): DomainProgress => ({ done: [], skipped: [], current: 0, issues: [] });
function emptyState(tester = ""): TestingState {
  return {
    tester,
    domains: DOMAIN_KEYS.reduce((acc, d) => ({ ...acc, [d]: emptyDomain() }), {} as Record<DomainKey, DomainProgress>),
  };
}

// ── Presentation backend: localStorage ────────────────────────────────────────────────
function loadLocal(): TestingState {
  const base = emptyState(TESTERS[0]!.email);
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as TestingState;
    return { tester: parsed.tester ?? base.tester, domains: { ...base.domains, ...parsed.domains } };
  } catch {
    return base;
  }
}
function persistLocal(next: TestingState) {
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
}

// ── Production backend: the server (Postgres) ─────────────────────────────────────────
const TITLE_SEV: Record<string, Severity> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };
async function loadRemote(): Promise<TestingState> {
  const [who, rows, issues] = await Promise.all([fetchWhoami(), fetchProgressRows(), fetchIssueRows()]);
  const base = emptyState(who.email);
  for (const row of rows) {
    if (!base.domains[row.domainKey]) continue;
    base.domains[row.domainKey] = { done: row.done, skipped: row.skipped, current: row.current, issues: [] };
  }
  for (const iss of issues) {
    const d = base.domains[iss.domainKey];
    if (!d) continue;
    d.issues.push({
      stepId: iss.stepId ?? "",
      title: iss.title,
      description: iss.description ?? "",
      severity: TITLE_SEV[iss.severity.toUpperCase()] ?? "Medium",
      at: String(iss.createdAt).slice(0, 16).replace("T", " "),
    });
  }
  return base;
}

/** Derived per-domain status from progress + the plan's step count. */
export function domainStatus(p: DomainProgress, total: number): DomainStatus {
  const handled = new Set([...p.done, ...p.skipped]).size;
  if (handled >= total && total > 0) return "completed";
  if (handled > 0 || p.current > 0) return "in_progress";
  return "not_started";
}

/** Best-effort status without a step count (the server recomputes the authoritative value). */
function roughStatus(p: DomainProgress): DomainStatus {
  const handled = new Set([...p.done, ...p.skipped]).size;
  return handled > 0 || p.current > 0 ? "in_progress" : "not_started";
}

/** React hook over whichever backend is active. */
export function useTesting() {
  const [state, setState] = React.useState<TestingState>(() => emptyState());
  const [ready, setReady] = React.useState(false);
  // Authoritative snapshot for computing the next state in production (no localStorage to read).
  const ref = React.useRef(state);
  ref.current = state;

  React.useEffect(() => {
    let alive = true;
    if (TESTING_PRESENTATION) {
      const s = loadLocal();
      setState(s); ref.current = s; setReady(true);
      return;
    }
    loadRemote()
      .then((s) => { if (alive) { setState(s); ref.current = s; } })
      .catch(() => { /* leave empty — components render their empty state */ })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const commit = React.useCallback((next: TestingState) => { setState(next); ref.current = next; }, []);

  const update = React.useCallback((d: DomainKey, fn: (p: DomainProgress) => DomainProgress) => {
    // Presentation reads localStorage (source of truth); production uses the in-memory snapshot.
    const cur = TESTING_PRESENTATION ? loadLocal() : ref.current;
    const nextDomain = fn(cur.domains[d]);
    const next: TestingState = { ...cur, domains: { ...cur.domains, [d]: nextDomain } };
    commit(next);
    if (TESTING_PRESENTATION) persistLocal(next);
    else void syncProgress(d, { status: roughStatus(nextDomain), done: nextDomain.done, skipped: nextDomain.skipped, current: nextDomain.current });
  }, [commit]);

  // Tester switching is a presentation-only affordance; production is always the logged-in user.
  const setTester = React.useCallback((email: string) => {
    if (!TESTING_PRESENTATION) return;
    const next = { ...loadLocal(), tester: email };
    commit(next); persistLocal(next);
  }, [commit]);

  const markDone = React.useCallback((d: DomainKey, stepId: string, nextIndex: number) =>
    update(d, (p) => ({ ...p, done: [...new Set([...p.done, stepId])], skipped: p.skipped.filter((s) => s !== stepId), current: nextIndex })), [update]);

  const skip = React.useCallback((d: DomainKey, stepId: string, nextIndex: number) =>
    update(d, (p) => ({ ...p, skipped: [...new Set([...p.skipped, stepId])], done: p.done.filter((s) => s !== stepId), current: nextIndex })), [update]);

  const goTo = React.useCallback((d: DomainKey, index: number) => update(d, (p) => ({ ...p, current: index })), [update]);

  const reportIssue = React.useCallback((d: DomainKey, issue: ReportedIssue) => {
    update(d, (p) => ({ ...p, issues: [issue, ...p.issues] }));
    // Production records + emails the Testing Admin; presentation is a no-op.
    void syncIssue({ domainKey: d, stepId: issue.stepId, title: issue.title, description: issue.description, severity: issue.severity });
  }, [update]);

  const resetDomain = React.useCallback((d: DomainKey) => update(d, () => emptyDomain()), [update]);

  // Mark a domain finished (End Testing): every step counts as handled so its status becomes
  // Completed. Issues are kept. The server recomputes status COMPLETED from done == all steps.
  const completeDomain = React.useCallback((d: DomainKey, stepIds: string[]) =>
    update(d, (p) => ({ ...p, done: [...new Set(stepIds)], skipped: [], current: Math.max(stepIds.length - 1, 0) })), [update]);

  return { state, ready, setTester, markDone, skip, goTo, reportIssue, resetDomain, completeDomain };
}
