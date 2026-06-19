"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, Play, RotateCw, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BadgeTone } from "@/lib/labels";
import { DOMAIN_KEYS, TESTERS, testerByEmail, type DomainKey, type DomainStatus } from "@/lib/mock/testing";
import { provisionDomain, fetchWhoami, TESTING_PRESENTATION, type Whoami } from "@/lib/api/testing";
import { useTesting, domainStatus } from "./store";
import { usePlans } from "./plans";

/** A friendly role label from either the mock TestRole or the server RoleKey enum. */
function roleLabel(role: string): string {
  const up = role.toUpperCase();
  if (up === "LCC") return "LCC";
  if (up === "ADMIN") return "Admin";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const STATUS: Record<DomainStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not Started", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};

export function TestingPortal() {
  const { state, ready, setTester } = useTesting();
  const { plans, ready: plansReady } = usePlans();
  // Presentation: identity from the mock roster + a tester switcher. Production: the real
  // logged-in user from the server (no mock, no switching).
  const mockTester = testerByEmail(state.tester) ?? TESTERS[0]!;
  const [who, setWho] = React.useState<Whoami | null>(null);
  React.useEffect(() => {
    if (TESTING_PRESENTATION) return;
    fetchWhoami().then(setWho).catch(() => setWho(null));
  }, []);

  const acting = TESTING_PRESENTATION
    ? { name: mockTester.name, email: mockTester.email, role: roleLabel(mockTester.role), isAdmin: mockTester.isAdmin }
    : { name: who?.name ?? who?.email ?? "—", email: who?.email ?? state.tester, role: who?.role ? roleLabel(who.role) : "—", isAdmin: who?.isAdmin ?? false };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Testing Portal"
        description="Validate every workflow, screen, integration, role and domain before production."
        actions={
          <div className="flex items-center gap-2">
            {TESTING_PRESENTATION ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                <FlaskConical className="size-3" /> Presentation mode · mock data
              </span>
            ) : null}
            <Button variant="outline" size="sm" asChild><Link href="/testing/report"><ShieldCheck /> Testing Report</Link></Button>
          </div>
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"><ShieldCheck className="size-4.5" /></span>
          <div>
            <p className="text-sm font-medium">Acting as {acting.name}{acting.isAdmin ? " · Testing Admin" : ""}</p>
            <p className="font-mono text-xs text-muted-foreground">{acting.email} · {acting.role}</p>
          </div>
        </div>
        {TESTING_PRESENTATION ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Switch tester</span>
            <Select value={state.tester} onValueChange={setTester}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select tester" /></SelectTrigger>
              <SelectContent>
                {TESTERS.map((t) => (
                  <SelectItem key={t.email} value={t.email}>{t.name}{t.isAdmin ? " (Admin)" : ` · ${t.role}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </Card>

      <SectionCard title="Domains" description="Validate each domain end-to-end" bodyClassName="p-4">
        {!plans ? (
          <p className="p-2 text-sm text-muted-foreground">{plansReady ? "No test plans found — run the seed." : "Loading test plans…"}</p>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {DOMAIN_KEYS.map((d) => {
            const plan = plans[d];
            const p = state.domains[d];
            const total = plan.steps.length;
            const status = ready ? domainStatus(p, total) : "not_started";
            const handled = ready ? new Set([...p.done, ...p.skipped]).size : 0;
            const pct = total ? Math.round((handled / total) * 100) : 0;
            const st = STATUS[status];
            return (
              <Card key={d} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{d}</Badge>
                      <span className="font-semibold">{plan.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.model}</p>
                  </div>
                  <Badge tone={st.tone} className="gap-1">
                    {status === "completed" ? <CheckCircle2 className="size-3" /> : null}{st.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pct} tone={status === "completed" ? "success" : "primary"} className="flex-1" />
                  <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{handled}/{total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtle-foreground">{plan.steps.length} guided steps</span>
                  {status === "completed" ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/testing/${d}`}><CheckCircle2 /> Review</Link>
                    </Button>
                  ) : (
                    <StartTestingButton d={d} status={status} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        )}
      </SectionCard>
    </div>
  );
}

/**
 * Start/Resume control. A fresh start triggers provisioning first: in presentation this is a
 * no-op and we just navigate; in production it creates the tester accounts + sends invites
 * (Testing Admin only) before opening the guided runner. On a provisioning error we stay and
 * surface the reason (e.g. a non-admin tester).
 */
function StartTestingButton({ d, status }: { d: DomainKey; status: DomainStatus }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const go = async () => {
    if (status === "not_started") {
      setBusy(true);
      setError(null);
      const r = await provisionDomain(d);
      setBusy(false);
      if (!r.ok) { setError(r.message ?? "Provisioning failed."); return; }
    }
    router.push(`/testing/${d}`);
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button size="sm" onClick={go} disabled={busy}>
        {busy ? <><Loader2 className="animate-spin" /> Provisioning…</>
          : status === "in_progress" ? <><RotateCw /> Resume Testing</>
          : <><Play /> Start Testing</>}
        {!busy && <ArrowRight />}
      </Button>
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="size-3" /> {error}</span>
      ) : null}
    </div>
  );
}
