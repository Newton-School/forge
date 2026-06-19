"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Play, Check, SkipForward, OctagonAlert, CheckCircle2, Circle, CircleDot,
  Target, ListChecks, Users, FolderGit2, Flag, Package, RotateCw, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BadgeTone } from "@/lib/labels";
import {
  TEST_PLANS, SEVERITIES, ISSUE_REPORT_EMAIL, type DomainKey, type Severity,
} from "@/lib/mock/testing";
import { endTesting, fetchEnvironment, TESTING_PRESENTATION, type DomainEnvironmentDto } from "@/lib/api/testing";
import { useTesting, domainStatus } from "./store";
import { usePlans, type RunnerStep } from "./plans";

/** Env rows the runner renders — flat string lists, unified across mock + server shapes. */
interface RunnerEnv {
  teachers: string[]; mentors: string[]; teamLeads: string[]; students: string[];
  teams: string[]; repositories: string[]; milestones: string[]; deliverables: string[];
}

const ROLE_TONE: Record<string, BadgeTone> = {
  Admin: "info", LCC: "info", Teacher: "primary", Mentor: "warning", "Team Lead": "warning", Mentee: "neutral",
};

function StepIcon({ s }: { s: "done" | "skipped" | "current" | "todo" }) {
  if (s === "done") return <CheckCircle2 className="size-4 text-success" />;
  if (s === "skipped") return <SkipForward className="size-4 text-muted-foreground" />;
  if (s === "current") return <CircleDot className="size-4 text-primary" />;
  return <Circle className="size-4 text-subtle-foreground" />;
}

export function DomainRunner({ domain }: { domain: DomainKey }) {
  const { state, ready, markDone, skip, goTo, reportIssue, resetDomain } = useTesting();
  const { plans, ready: plansReady } = usePlans();
  const [started, setStarted] = React.useState<string | null>(null);

  const plan = plans?.[domain] ?? null;
  const p = state.domains[domain];
  const steps = plan?.steps ?? [];
  const total = steps.length;
  const doneSet = new Set(p.done);
  const skipSet = new Set(p.skipped);
  const handled = new Set([...p.done, ...p.skipped]).size;
  const status = ready ? domainStatus(p, total) : "not_started";
  const idx = Math.min(p.current, Math.max(total - 1, 0));
  const step = steps[idx];

  const stepState = (s: RunnerStep, i: number): "done" | "skipped" | "current" | "todo" =>
    doneSet.has(s.id) ? "done" : skipSet.has(s.id) ? "skipped" : i === idx ? "current" : "todo";

  const nextIndex = (from: number) => {
    for (let i = from + 1; i < total; i++) if (!doneSet.has(steps[i]!.id) && !skipSet.has(steps[i]!.id)) return i;
    // none ahead → first unhandled anywhere, else end
    for (let i = 0; i < total; i++) if (!doneSet.has(steps[i]!.id) && !skipSet.has(steps[i]!.id)) return i;
    return Math.min(from + 1, total - 1);
  };

  // Presentation → the mock environment (mock-only fixture). Production → the REAL provisioned
  // env from the server (no mock data); null until loaded / when not provisioned yet.
  const mockEnv = TEST_PLANS[domain].environment;
  const presentationEnv: RunnerEnv = {
    teachers: mockEnv.teachers.map((x) => x.name),
    mentors: mockEnv.mentors.map((x) => x.name),
    teamLeads: mockEnv.teamLeads.map((x) => x.name),
    students: mockEnv.students.map((x) => x.name),
    teams: mockEnv.teams.map((t) => t.name),
    repositories: mockEnv.repositories,
    milestones: mockEnv.milestones,
    deliverables: mockEnv.deliverables,
  };
  const [remoteEnv, setRemoteEnv] = React.useState<DomainEnvironmentDto | null>(null);
  React.useEffect(() => {
    if (TESTING_PRESENTATION) return;
    fetchEnvironment(domain).then(setRemoteEnv).catch(() => setRemoteEnv(null));
  }, [domain]);
  const env: RunnerEnv | null = TESTING_PRESENTATION
    ? presentationEnv
    : remoteEnv ? { ...remoteEnv, teamLeads: [] } : null;
  const provisioned = TESTING_PRESENTATION || (remoteEnv?.provisioned ?? false);

  // Production plans load async — render a light shell until the script arrives.
  if (!plan) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Domain Testing"
          actions={<Button variant="outline" size="sm" asChild><Link href="/testing"><ArrowLeft /> Testing Portal</Link></Button>}
        />
        <Card className="p-6 text-sm text-muted-foreground">{plansReady ? "Test plan not found — run the seed." : "Loading test plan…"}</Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${plan.name} — Domain Testing`}
        description={plan.model}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/testing"><ArrowLeft /> Testing Portal</Link></Button>
            <EndTestingButton />
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Progress value={total ? Math.round((handled / total) * 100) : 0} tone={status === "completed" ? "success" : "primary"} className="flex-1" />
        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{handled}/{total} steps</span>
        <Badge tone={status === "completed" ? "success" : status === "in_progress" ? "warning" : "neutral"}>
          {status === "completed" ? "Domain Completed" : status === "in_progress" ? "In Progress" : "Not Started"}
        </Badge>
      </div>

      {status === "completed" ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-success/30 bg-success-bg/40 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-success" />
            <div>
              <p className="font-medium">Domain Completed</p>
              <p className="text-sm text-muted-foreground">All {total} test cases handled · {p.issues.length} issue{p.issues.length === 1 ? "" : "s"} reported.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { resetDomain(domain); setStarted(null); }}><RotateCw /> Reset domain</Button>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current step (guided) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {step ? (
            <SectionCard
              title={`Step ${idx + 1} of ${total}`}
              description={step.group}
              action={<Badge tone={ROLE_TONE[step.role] ?? "neutral"}>Act as {step.role}</Badge>}
              bodyClassName="flex flex-col gap-4 p-5"
            >
              <div>
                <h3 className="text-base font-semibold">{step.title}</h3>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground"><Target className="size-3" /> Current step</p>
                <p className="mt-1 text-sm text-foreground">{step.instruction}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-info-bg/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-info">Expected result</p>
                  <p className="mt-1 text-sm text-foreground">{step.expected}</p>
                </div>
                <div className="rounded-lg border border-border bg-success-bg/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-success">Success criteria</p>
                  <p className="mt-1 text-sm text-foreground">{step.success}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button size="sm" variant={started === step.id ? "secondary" : "default"} onClick={() => setStarted(step.id)} disabled={status === "completed"}>
                  <Play /> {started === step.id ? "Step started" : "Start Step"}
                </Button>
                <Button size="sm" onClick={() => { markDone(domain, step.id, nextIndex(idx)); setStarted(null); }} disabled={status === "completed"}>
                  <Check /> Mark as Done
                </Button>
                <Button size="sm" variant="outline" onClick={() => { skip(domain, step.id, nextIndex(idx)); setStarted(null); }} disabled={status === "completed"}>
                  <SkipForward /> Skip
                </Button>
                <IssueDialog onReport={(issue) => reportIssue(domain, { ...issue, stepId: step.id, at: new Date().toISOString().slice(0, 16).replace("T", " ") })} stepTitle={step.title} />
              </div>
            </SectionCard>
          ) : null}

          {/* Sequential step list */}
          <SectionCard title="Testing checklist" description="Complete in sequence" bodyClassName="p-2">
            <ol className="flex flex-col">
              {steps.map((s, i) => {
                const st = stepState(s, i);
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => goTo(domain, i)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${i === idx ? "bg-muted/50" : ""}`}
                    >
                      <StepIcon s={st} />
                      <span className="w-6 text-xs tabular-nums text-subtle-foreground">{i + 1}</span>
                      <span className={`flex-1 ${st === "done" ? "text-muted-foreground line-through" : st === "skipped" ? "text-muted-foreground" : "font-medium"}`}>{s.title}</span>
                      <Badge tone="neutral" className="hidden sm:inline-flex">{s.group}</Badge>
                      <Badge tone={ROLE_TONE[s.role] ?? "neutral"}>{s.role}</Badge>
                    </button>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
        </div>

        {/* Environment + issues */}
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Domain environment"
            description={TESTING_PRESENTATION ? "Auto-populated mock data" : "Provisioned environment (live)"}
            bodyClassName="flex flex-col gap-3 p-4"
          >
            {!env ? (
              <p className="text-sm text-muted-foreground">Loading environment…</p>
            ) : !provisioned ? (
              <p className="text-sm text-muted-foreground">Not provisioned yet — start this domain from the Testing Portal to create the environment.</p>
            ) : (
              <>
                <EnvRow icon={<Users className="size-3.5" />} label="Teachers" items={env.teachers} />
                <EnvRow icon={<Users className="size-3.5" />} label="Mentors" items={env.mentors} />
                {env.teamLeads.length ? <EnvRow icon={<Users className="size-3.5" />} label="Team Leads" items={env.teamLeads} /> : null}
                <EnvRow icon={<Users className="size-3.5" />} label="Students" items={env.students} />
                <EnvRow icon={<ListChecks className="size-3.5" />} label="Teams" items={env.teams} />
                <EnvRow icon={<FolderGit2 className="size-3.5" />} label="Repositories" items={env.repositories} mono />
                <EnvRow icon={<Flag className="size-3.5" />} label="Milestones" items={env.milestones} />
                <EnvRow icon={<Package className="size-3.5" />} label="Deliverables" items={env.deliverables} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Reported issues" description={`${p.issues.length} this domain`} bodyClassName="p-4">
            {p.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues reported yet. Use <span className="font-medium">Report Issue</span> on any step.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {p.issues.map((it, i) => (
                  <li key={i} className="rounded-md border border-border p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{it.title}</span>
                      <Badge tone={it.severity === "Critical" ? "danger" : it.severity === "High" ? "warning" : "neutral"}>{it.severity}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{it.description}</p>
                    <p className="mt-1 text-[11px] text-subtle-foreground">{it.at}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-subtle-foreground">In production, reports email <span className="font-mono">{ISSUE_REPORT_EMAIL}</span>.</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/**
 * End Testing — tears down the active domain's provisioned environment (production: deletes
 * the tester accounts + their data, keeping Shaik/LCC and the testing report). Confirmed
 * because it's destructive; on success returns to the Testing Portal. Presentation → no-op.
 */
function EndTestingButton() {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive" size="sm"><Trash2 /> End Testing</Button>}
      title="End testing & clear this domain?"
      description="Deletes the provisioned tester accounts and their data so another domain can be tested. Shaik (Admin), LCC, and the testing report are kept. In presentation mode nothing is deleted."
      confirmLabel="End & clear"
      destructive
      onConfirm={async () => {
        const r = await endTesting();
        if (!r.ok) throw new Error(r.message ?? "Could not end testing.");
        router.push("/testing");
      }}
    />
  );
}

function EnvRow({ icon, label, items, mono }: { icon: React.ReactNode; label: string; items: string[]; mono?: boolean }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">{icon} {label} · {items.length}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((x) => <Badge key={x} tone="neutral" className={mono ? "font-mono text-[10px]" : ""}>{x}</Badge>)}
      </div>
    </div>
  );
}

/** Mock issue-report dialog: Title / Description / Severity / Screenshots placeholder. */
function IssueDialog({ onReport, stepTitle }: { onReport: (i: { title: string; description: string; severity: Severity }) => void; stepTitle: string }) {
  return (
    <FormDialog
      trigger={<Button size="sm" variant="ghost" className="text-danger"><OctagonAlert /> Report Issue</Button>}
      title="Report an issue"
      description={`Step: ${stepTitle}`}
      submitLabel="Submit report"
      destructive
      onSubmit={(data) => {
        onReport({
          title: String(data.get("title") ?? "").trim() || "Untitled issue",
          description: String(data.get("description") ?? "").trim(),
          severity: (String(data.get("severity") ?? "Medium") as Severity),
        });
      }}
    >
      <Field label="Title" htmlFor="iss-title"><Input id="iss-title" name="title" placeholder="What went wrong?" required /></Field>
      <Field label="Description" htmlFor="iss-desc"><Textarea id="iss-desc" name="description" placeholder="Steps to reproduce, what you expected, what happened…" className="min-h-24" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Severity">
          <Select name="severity" defaultValue="Medium">
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Screenshots" hint="attach in production">
          <Input type="file" disabled />
        </Field>
      </div>
      <p className="text-[11px] text-subtle-foreground">
        {TESTING_PRESENTATION
          ? <>Presentation mode — the report is recorded locally; production emails {ISSUE_REPORT_EMAIL}.</>
          : <>Recorded server-side and emailed to {ISSUE_REPORT_EMAIL}.</>}
      </p>
    </FormDialog>
  );
}
