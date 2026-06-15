import Link from "next/link";
import { ArrowLeft, OctagonAlert, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { ConcernBadge, SeverityBadge } from "@/components/dashboard/status-badge";
import { ConcernTimeline, type TimelineEvent } from "@/components/concerns/concern-timeline";
import { Button } from "@/components/ui/button";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CONCERNS, CONCERN_CATEGORIES } from "@/lib/api";
import { shortDate } from "@/lib/utils";
import type { ConcernStatus } from "@/lib/types";

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildTimeline(c: (typeof CONCERNS)[number]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { status: "OPEN", actor: c.raisedBy, note: "Concern raised and routed to the assigned owner.", at: shortDate(c.createdAt) },
    { status: "ACKNOWLEDGED", actor: c.assignedTo, note: "Acknowledged; triaged for review.", at: shortDate(addDays(c.createdAt, 1)) },
  ];

  if (["IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REOPENED"].includes(c.status)) {
    events.push({ status: "IN_PROGRESS", actor: c.assignedTo, note: "Investigation underway; gathering details.", at: shortDate(addDays(c.createdAt, 2)) });
  }
  if (c.status === "ESCALATED") {
    events.push({ status: "ESCALATED", actor: "LCC", note: "Escalated past SLA — owner unresponsive.", at: shortDate(c.slaDue) });
  }
  if (["RESOLVED", "CLOSED"].includes(c.status)) {
    events.push({ status: c.status as ConcernStatus, actor: c.assignedTo, note: c.status === "CLOSED" ? "Closed after confirmation." : "Resolution applied; awaiting confirmation.", at: shortDate(addDays(c.createdAt, 3)) });
  }
  if (c.status === "REOPENED") {
    events.push({ status: "REOPENED", actor: c.raisedBy, note: "Reopened — issue recurred.", at: shortDate(addDays(c.createdAt, 4)) });
  }
  return events;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concern = CONCERNS.find((c) => c.id === id || c.ref === id) ?? CONCERNS[0];
  const categoryLabel = CONCERN_CATEGORIES.find((c) => c.value === concern.category)?.label ?? concern.category;
  const events = buildTimeline(concern);
  const isOpen = !["RESOLVED", "CLOSED"].includes(concern.status);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={concern.title}
        description="Concern detail and resolution timeline."
        actions={
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/lcc/concerns"><ArrowLeft className="size-3.5" /> Back to concerns</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="font-mono text-sm text-foreground">{concern.ref}</span>
        <span className="text-subtle-foreground">·</span>
        <Badge tone="neutral">{categoryLabel}</Badge>
        <SeverityBadge v={concern.severity} />
        <ConcernBadge v={concern.status} />
        {isOpen ? (
          <div className="flex items-center gap-1.5">
            <ConfirmDialog
              trigger={<Button size="sm" variant="ghost">Acknowledge</Button>}
              title="Acknowledge concern?"
              confirmLabel="Acknowledge"
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="ghost">Start progress</Button>}
              title="Start progress?"
              confirmLabel="Start progress"
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline">Escalate</Button>}
              title="Escalate to organizing team?"
              confirmLabel="Escalate"
              destructive
            />
          </div>
        ) : null}
        <span className="ml-auto text-xs text-subtle-foreground">SLA due {shortDate(concern.slaDue)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Description" action={<OctagonAlert className="size-4 text-muted-foreground" />} bodyClassName="p-5">
            <p className="text-sm text-foreground">{concern.description}</p>
          </SectionCard>

          <SectionCard title="Timeline" description="Status history" bodyClassName="p-5">
            <ConcernTimeline events={events} />
          </SectionCard>

          <SectionCard title="Resolution" description={isOpen ? "Record the outcome to resolve" : "This concern is closed"} bodyClassName="flex flex-col gap-3 p-5">
            <Textarea placeholder="Describe how this concern was resolved…" className="min-h-24" disabled={!isOpen} />
            <div className="flex justify-end">
              {isOpen ? (
                <FormDialog
                  trigger={<Button size="sm">Resolve</Button>}
                  title="Resolve concern"
                  submitLabel="Mark resolved"
                >
                  <Field label="Resolution note" htmlFor="resolution-note">
                    <Textarea id="resolution-note" placeholder="Describe how this concern was resolved…" />
                  </Field>
                </FormDialog>
              ) : (
                <Button size="sm" disabled>Resolve</Button>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Details" bodyClassName="flex flex-col divide-y divide-border">
            {[
              { label: "Raised By", value: concern.raisedBy },
              { label: "Role", value: concern.raisedByRole.replace(/_/g, " ") },
              { label: "Assigned To", value: concern.assignedTo },
              { label: "Domain", value: concern.domainKey },
              { label: "Created", value: shortDate(concern.createdAt) },
              { label: "SLA Due", value: shortDate(concern.slaDue) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs text-subtle-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Linked Entity" action={<Paperclip className="size-4 text-muted-foreground" />} bodyClassName="p-4">
            <Link href="/mentee/team" className="text-sm text-primary hover:underline">{concern.domainKey} · AI Group 07</Link>
            <p className="mt-1 text-xs text-muted-foreground">Related team for this concern.</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
