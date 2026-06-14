"use client";

import { useState } from "react";
import { Plus, Pencil, Settings } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DOMAINS } from "@/lib/mock/data";

const ALL = "All domains";
const DOMAIN_OPTIONS = DOMAINS.map((d) => d.key); // ["AI","ML","SDSE"]

// Every config item carries a `domain` scope: ALL (all domains) or one domain key.
const PHASES = [
  { seq: 1, name: "Phase 1 — Explore", theme: "Skill discovery & interest declaration", startsAt: "2026-06-01T09:00", endsAt: "2026-06-10T18:00", domain: ALL },
  { seq: 2, name: "Phase 2 — Propose", theme: "Proposal drafting & faculty gate", startsAt: "2026-06-11T09:00", endsAt: "2026-06-13T18:00", domain: ALL },
  { seq: 3, name: "Phase 3 — Build", theme: "Milestones, hackathons & deliverables", startsAt: "2026-06-15T09:00", endsAt: "2026-07-10T18:00", domain: ALL },
  { seq: 4, name: "Phase 4 — Showcase", theme: "Final demo, report & top-team selection", startsAt: "2026-07-13T09:00", endsAt: "2026-07-24T18:00", domain: ALL },
];

const GATES = [
  { name: "Gate 1 — Proposal", verdicts: ["Approved", "Revise", "Rejected"], blocks: true, owner: "Teacher", scheduledAt: "2026-06-13T17:00", domain: ALL },
  { name: "Gate 2 — Milestone 1", verdicts: ["Approved", "Revise", "Rejected"], blocks: true, owner: "Teacher", scheduledAt: "2026-06-27T17:00", domain: ALL },
  { name: "Gate 3 — Final Submission", verdicts: ["Approved", "Revise", "Rejected"], blocks: true, owner: "LCC", scheduledAt: "2026-07-22T17:00", domain: ALL },
];

const CYCLES = [
  { level: "L1 — Mentee Update", who: "Mentee", intervalValue: 2, intervalUnit: "DAY", anchorDay: "—", domain: ALL },
  { level: "L2 — Mentor Check-in", who: "Mentor", intervalValue: 2, intervalUnit: "DAY", anchorDay: "—", domain: ALL },
  { level: "L3 — Mentor Status", who: "Mentor", intervalValue: 1, intervalUnit: "WEEK", anchorDay: "Saturday", domain: ALL },
  { level: "L4 — Teacher Decision", who: "Teacher", intervalValue: 1, intervalUnit: "WEEK", anchorDay: "Sunday", domain: ALL },
];

const ESCALATIONS = [
  { trigger: "No update for 3 days", outcome: "Yellow Flag", tone: "warning" as const, domain: ALL },
  { trigger: "No update for 5 days", outcome: "Red Flag", tone: "danger" as const, domain: ALL },
  { trigger: "No mentor feedback for 1 week", outcome: "Escalate to Teacher", tone: "warning" as const, domain: ALL },
  { trigger: "Blocker unresolved for 3 days", outcome: "Escalate to LCC", tone: "danger" as const, domain: ALL },
  { trigger: "Same blocker across 3+ updates", outcome: "Repeated Blocker", tone: "warning" as const, domain: ALL },
  // Domain-specific examples:
  { trigger: "No GitHub commit for 4 days", outcome: "GitHub Inactivity Flag", tone: "warning" as const, domain: "AI" },
  { trigger: "No dataset submitted by week 2", outcome: "Escalate to Teacher", tone: "danger" as const, domain: "ML" },
];

const RUBRICS = [
  { dimension: "Technical Execution", weight: 35, desc: "Code quality, architecture, working features", domain: ALL },
  { dimension: "Problem & Impact", weight: 25, desc: "Clarity of problem, real-world relevance", domain: ALL },
  { dimension: "Process & Consistency", weight: 20, desc: "Update cadence, milestone adherence", domain: ALL },
  { dimension: "Presentation", weight: 15, desc: "Demo, report and storytelling", domain: ALL },
  { dimension: "Collaboration", weight: 5, desc: "Teamwork and peer contribution", domain: ALL },
  // Domain-specific example: ML weights model performance.
  { dimension: "Model Performance", weight: 30, desc: "Metric scores vs. baseline (PR-AUC, F1…)", domain: "ML" },
];

const ROLE_OPTIONS = ["Mentee", "Mentor", "Teacher", "LCC", "Admin"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PHASE_OPTIONS = PHASES.map((p) => p.name);

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function cadenceLabel(c: { intervalValue: number; intervalUnit: string; anchorDay?: string }) {
  const unit = { DAY: "day", WEEK: "week", MONTH: "month" }[c.intervalUnit] ?? "day";
  const base = c.intervalValue === 1 ? `Every ${unit}` : `Every ${c.intervalValue} ${unit}s`;
  return c.anchorDay && c.anchorDay !== "—" ? `${base} · ${c.anchorDay}` : base;
}

/** Keep an item when viewing all, or when it's global (ALL) or matches the domain. */
function scoped<T extends { domain: string }>(rows: T[], view: string) {
  if (view === ALL) return rows;
  return rows.filter((r) => r.domain === view || r.domain === ALL);
}

function DomainBadge({ domain }: { domain: string }) {
  return domain === ALL
    ? <Badge tone="neutral">All domains</Badge>
    : <Badge tone="info">{domain}</Badge>;
}

/** "Applies to" scope picker, present in every config modal. */
function ScopeField({ value }: { value?: string }) {
  return (
    <Field label="Applies to" hint="all domains, or one domain at a time (a Teacher is limited to their own)">
      <Select defaultValue={value ?? ALL}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All domains</SelectItem>
          {DOMAIN_OPTIONS.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function EditButton({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Edit ${label}`}>
          <Pencil />
        </Button>
      }
      title={title}
      submitLabel="Save changes"
    >
      {children}
    </FormDialog>
  );
}

function PhaseFields({ phase }: { phase?: (typeof PHASES)[number] }) {
  const minNow = localNow();
  const [start, setStart] = useState(phase?.startsAt ?? "");
  const [end, setEnd] = useState(phase?.endsAt ?? "");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input placeholder="Phase 1 — Explore" defaultValue={phase?.name} />
        </Field>
        <Field label="Sequence">
          <Input type="number" placeholder="1" defaultValue={phase?.seq} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts at" hint="today or later">
          <Input
            type="datetime-local"
            min={minNow}
            value={start}
            onChange={(e) => {
              const v = e.target.value;
              setStart(v);
              if (end && v && end < v) setEnd(v);
            }}
          />
        </Field>
        <Field label="Ends at" hint="after the start">
          <Input
            type="datetime-local"
            min={start || minNow}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Theme">
        <Input placeholder="Skill discovery" defaultValue={phase?.theme} />
      </Field>
      <ScopeField value={phase?.domain} />
    </>
  );
}

function GateFields({ gate }: { gate?: (typeof GATES)[number] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input placeholder="Gate 1 — Proposal" defaultValue={gate?.name} />
        </Field>
        <Field label="Scheduled at" hint="today or later">
          <Input type="datetime-local" min={localNow()} defaultValue={gate?.scheduledAt} />
        </Field>
      </div>
      <Field label="Phase">
        <Select>
          <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
          <SelectContent>
            {PHASE_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Verdict options">
        <Input defaultValue="Approved, Revise & Resubmit, Rejected" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Blocks progression">
          <Select defaultValue={gate ? (gate.blocks ? "yes" : "no") : "yes"}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <ScopeField value={gate?.domain} />
      </div>
    </>
  );
}

function CycleFields({ cycle }: { cycle?: (typeof CYCLES)[number] }) {
  const [unit, setUnit] = useState<string>(cycle?.intervalUnit ?? "DAY");
  const [anchor, setAnchor] = useState<string>(
    cycle?.anchorDay && cycle.anchorDay !== "—" ? cycle.anchorDay : "none",
  );
  const weekly = unit === "WEEK";
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="L1">L1</SelectItem>
              <SelectItem value="L2">L2</SelectItem>
              <SelectItem value="L3">L3</SelectItem>
              <SelectItem value="L4">L4</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Owner role">
          <Select defaultValue={cycle?.who}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Every">
          <Input type="number" min={1} placeholder="2" defaultValue={cycle?.intervalValue} />
        </Field>
        <Field label="Unit">
          <Select
            value={unit}
            onValueChange={(v) => {
              setUnit(v);
              if (v !== "WEEK") setAnchor("none");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">Days</SelectItem>
              <SelectItem value="WEEK">Weeks</SelectItem>
              <SelectItem value="MONTH">Months</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Anchor day" hint={weekly ? "pick a weekday" : "weekly only"}>
          <Select value={weekly ? anchor : "none"} onValueChange={setAnchor} disabled={!weekly}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <ScopeField value={cycle?.domain} />
      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Stored as <span className="font-mono text-foreground">{`{ intervalValue, intervalUnit, anchorDay, domainId }`}</span> — a real
        number + unit, not the text &quot;every 2 days&quot;. <span className="font-mono text-foreground">domainId</span> null = all domains.
      </p>
    </>
  );
}

function EscalationFields({ rule }: { rule?: (typeof ESCALATIONS)[number] }) {
  return (
    <>
      <Field label="Name">
        <Input placeholder="No update for 3 days" defaultValue={rule?.trigger} />
      </Field>
      <Field label="Condition">
        <Input placeholder="days since last update" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Threshold value">
          <Input type="number" placeholder="3" />
        </Field>
        <Field label="Unit">
          <Select defaultValue="days">
            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="days">days</SelectItem>
              <SelectItem value="updates">updates</SelectItem>
              <SelectItem value="hours">hours</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Action">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Flag">Flag</SelectItem>
              <SelectItem value="Notify">Notify</SelectItem>
              <SelectItem value="Escalate">Escalate</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Target role">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <ScopeField value={rule?.domain} />
    </>
  );
}

function RubricFields({ rubric }: { rubric?: (typeof RUBRICS)[number] }) {
  return (
    <>
      <Field label="Dimension name">
        <Input placeholder="Technical Execution" defaultValue={rubric?.dimension} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Weight %">
          <Input type="number" placeholder="35" defaultValue={rubric?.weight} />
        </Field>
        <Field label="Measured by">
          <Input placeholder="Code quality, architecture" defaultValue={rubric?.desc} />
        </Field>
      </div>
      <ScopeField value={rubric?.domain} />
    </>
  );
}

export default function AdminConfigurationPage() {
  const [view, setView] = useState(ALL);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Drive Configuration"
        description="Phases, gates, review cycles, escalation rules and rubrics are admin-configurable data — applied to all domains or one domain at a time."
      />

      <SectionCard
        title="Configurable parameters"
        description="Each item applies to all domains, or just one — use the scope filter to view a domain"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Viewing</span>
            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All domains</SelectItem>
                {DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        bodyClassName="p-4"
      >
        <Tabs defaultValue="phases">
          <TabsList className="w-full">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="gates">Gates</TabsTrigger>
            <TabsTrigger value="cycles">Review Cycles</TabsTrigger>
            <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
            <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
          </TabsList>

          <TabsContent value="phases">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <FormDialog
                  trigger={<Button variant="outline" size="sm"><Plus />Add Phase</Button>}
                  title="Add phase"
                  submitLabel="Create phase"
                >
                  <PhaseFields />
                </FormDialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-right">#</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Theme</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoped(PHASES, view).map((p) => (
                    <TableRow key={p.seq}>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{p.seq}</TableCell>
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.theme}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDateTime(p.startsAt)} <span className="text-subtle-foreground">→</span> {fmtDateTime(p.endsAt)}
                      </TableCell>
                      <TableCell><DomainBadge domain={p.domain} /></TableCell>
                      <TableCell className="text-right">
                        <EditButton label={p.name} title="Edit phase"><PhaseFields phase={p} /></EditButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="gates">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <FormDialog
                  trigger={<Button variant="outline" size="sm"><Plus />Add Gate</Button>}
                  title="Add gate"
                  submitLabel="Create gate"
                >
                  <GateFields />
                </FormDialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gate</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Verdicts</TableHead>
                    <TableHead>Blocks</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoped(GATES, view).map((g) => (
                    <TableRow key={g.name}>
                      <TableCell className="font-medium text-foreground">{g.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(g.scheduledAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.verdicts.map((v) => (<Badge key={v} tone="neutral">{v}</Badge>))}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge text={g.blocks ? "Yes" : "No"} tone={g.blocks ? "warning" : "neutral"} /></TableCell>
                      <TableCell className="text-muted-foreground">{g.owner}</TableCell>
                      <TableCell><DomainBadge domain={g.domain} /></TableCell>
                      <TableCell className="text-right">
                        <EditButton label={g.name} title="Edit gate"><GateFields gate={g} /></EditButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="cycles">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <FormDialog
                  trigger={<Button variant="outline" size="sm"><Plus />Add Cycle</Button>}
                  title="Add review cycle"
                  submitLabel="Create cycle"
                >
                  <CycleFields />
                </FormDialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Review level</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Stored as</TableHead>
                    <TableHead>Submitted by</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoped(CYCLES, view).map((c) => (
                    <TableRow key={c.level}>
                      <TableCell className="font-medium text-foreground">{c.level}</TableCell>
                      <TableCell className="text-muted-foreground">{cadenceLabel(c)}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {c.intervalValue} · {c.intervalUnit}{c.anchorDay !== "—" ? ` · ${c.anchorDay}` : ""}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.who}</TableCell>
                      <TableCell><DomainBadge domain={c.domain} /></TableCell>
                      <TableCell className="text-right">
                        <EditButton label={c.level} title="Edit review cycle"><CycleFields cycle={c} /></EditButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="escalation">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <FormDialog
                  trigger={<Button variant="outline" size="sm"><Plus />Add Rule</Button>}
                  title="Add escalation rule"
                  submitLabel="Create rule"
                >
                  <EscalationFields />
                </FormDialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoped(ESCALATIONS, view).map((e) => (
                    <TableRow key={e.trigger}>
                      <TableCell className="font-medium text-foreground">{e.trigger}</TableCell>
                      <TableCell><StatusBadge text={e.outcome} tone={e.tone} /></TableCell>
                      <TableCell><DomainBadge domain={e.domain} /></TableCell>
                      <TableCell className="text-right">
                        <EditButton label={e.trigger} title="Edit escalation rule"><EscalationFields rule={e} /></EditButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="rubrics">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Selection rubric · all-domain weights total 100%</p>
                <FormDialog
                  trigger={<Button variant="outline" size="sm"><Plus />Add Dimension</Button>}
                  title="Add rubric dimension"
                  submitLabel="Create dimension"
                >
                  <RubricFields />
                </FormDialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dimension</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoped(RUBRICS, view).map((r) => (
                    <TableRow key={r.dimension}>
                      <TableCell className="font-medium text-foreground">{r.dimension}</TableCell>
                      <TableCell className="text-muted-foreground">{r.desc}</TableCell>
                      <TableCell><DomainBadge domain={r.domain} /></TableCell>
                      <TableCell className="text-right"><Badge tone="primary">{r.weight}%</Badge></TableCell>
                      <TableCell className="text-right">
                        <EditButton label={r.dimension} title="Edit rubric dimension"><RubricFields rubric={r} /></EditButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>
    </div>
  );
}
