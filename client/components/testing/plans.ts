"use client";

/**
 * Guided test plans, source-switched by APP_MODE. Presentation → the mock fixtures
 * (synchronous). Production → the DB-backed plans from `GET /testing/plans` (editable without a
 * redeploy). The runner/portal consume `RunnerPlan` and don't care where it came from.
 */
import * as React from "react";
import { TEST_PLANS, DOMAIN_KEYS, type DomainKey } from "@/lib/mock/testing";
import { TESTING_PRESENTATION, fetchPlans, type PlanDto } from "@/lib/api/testing";

export interface RunnerStep { id: string; group: string; role: string; title: string; instruction: string; expected: string; success: string }
export interface RunnerPlan { domainKey: DomainKey; name: string; model: string; steps: RunnerStep[] }
export type PlanMap = Record<DomainKey, RunnerPlan>;

/** Map the mock fixtures into the runner shape (dropping the mock-only environment). */
function fromMock(): PlanMap {
  return DOMAIN_KEYS.reduce((acc, d) => {
    const p = TEST_PLANS[d];
    acc[d] = { domainKey: d, name: p.name, model: p.model, steps: p.steps.map((s) => ({ ...s })) };
    return acc;
  }, {} as PlanMap);
}

function fromDtos(items: PlanDto[]): PlanMap {
  const acc = {} as PlanMap;
  for (const p of items) acc[p.domainKey] = { domainKey: p.domainKey, name: p.name, model: p.model, steps: p.steps };
  return acc;
}

export function usePlans(): { plans: PlanMap | null; ready: boolean } {
  const [plans, setPlans] = React.useState<PlanMap | null>(() => (TESTING_PRESENTATION ? fromMock() : null));
  const [ready, setReady] = React.useState(TESTING_PRESENTATION);

  React.useEffect(() => {
    if (TESTING_PRESENTATION) return;
    let alive = true;
    fetchPlans()
      .then((items) => { if (alive) setPlans(fromDtos(items)); })
      .catch(() => { /* leave null — components show their loading/empty state */ })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  return { plans, ready };
}
