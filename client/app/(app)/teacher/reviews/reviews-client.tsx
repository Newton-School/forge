"use client";

import { CircleCheck, CircleAlert, Flag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlagBadge, L3Badge, L4Badge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { submit } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { MockWeeklyReview } from "@/lib/api";

// Each gate maps to a project proposal; `projectId` is the record the verdict posts to.
// In presentation mode the POST is a no-op; in production these come from /projects.
const GATES = [
  {
    projectId: "p-shipyard",
    name: "Gate 1 — Proposal",
    detail: "Group + individual proposals submitted for faculty approval.",
    verdict: "Approved",
    icon: <CircleCheck />,
    iconClass: "text-success",
    chipClass: "bg-success-bg text-success",
  },
  {
    projectId: "p-engageiq",
    name: "Gate 2 — Milestone 1",
    detail: "Working core feature on GitHub with README — awaiting review.",
    verdict: "Pending",
    icon: <CircleAlert />,
    iconClass: "text-warning",
    chipClass: "bg-warning-bg text-warning",
  },
  {
    projectId: "p-streamline",
    name: "Gate 3 — Panel",
    detail: "Full project panel evaluation — scheduled later this phase.",
    verdict: "Upcoming",
    icon: <Flag />,
    iconClass: "text-info",
    chipClass: "bg-info-bg text-info",
  },
];

export function ReviewsClient({
  reviews,
  domains,
}: {
  reviews: MockWeeklyReview[];
  domains: string[];
}) {
  const router = useRouter();

  async function saveDecision(reviewId: string, data: FormData) {
    await submit(`/reviews/weekly/${reviewId}/decision`, "POST", {
      decision: String(data.get("decision") ?? "CONTINUE"),
      notes: (data.get("notes") as string) || undefined,
    });
    router.refresh();
  }

  async function decideProposal(
    projectId: string,
    decision: "APPROVED" | "REVISE_RESUBMIT" | "REJECTED",
    feedback?: string,
  ) {
    await submit(`/projects/${projectId}/proposal-decision`, "POST", { decision, feedback });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reviews & Gates"
        description="Teacher completes L4 every Sunday"
        actions={<DomainFilter options={domains} />}
      />

      <Tabs defaultValue="l4">
        <TabsList>
          <TabsTrigger value="l4">L4 Weekly Reviews</TabsTrigger>
          <TabsTrigger value="gates">Faculty Gates</TabsTrigger>
        </TabsList>

        <TabsContent value="l4">
          <SectionCard
            title="L4 weekly reviews"
            description="Mentor (L3) reviews awaiting teacher (L4) decision"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentee</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead className="max-w-xs">Progress Summary</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Mentor Status</TableHead>
                  <TableHead>Teacher Decision</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.mentee}</TableCell>
                    <TableCell><Badge tone="info">{r.domainKey}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.mentor}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="block truncate text-muted-foreground">{r.progressSummary}</span>
                    </TableCell>
                    <TableCell><FlagBadge v={r.autoFlag} /></TableCell>
                    <TableCell><L3Badge v={r.mentorStatus} /></TableCell>
                    <TableCell><L4Badge v={r.teacherDecision} /></TableCell>
                    <TableCell className="text-right">
                      {r.teacherDecision === null ? (
                        <FormDialog
                          trigger={<Button size="sm">Set decision</Button>}
                          title={`Teacher decision (L4) — ${r.mentee}`}
                          submitLabel="Save decision"
                          onSubmit={(data) => saveDecision(r.id, data)}
                        >
                          <Field label="Decision">
                            <Select name="decision" defaultValue="CONTINUE">
                              <SelectTrigger><SelectValue placeholder="Select a decision" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CONTINUE">Continue</SelectItem>
                                <SelectItem value="MONITOR">Monitor</SelectItem>
                                <SelectItem value="SCHEDULE_DISCUSSION">Schedule Discussion</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Teacher notes" htmlFor="l4-notes">
                            <Textarea id="l4-notes" name="notes" rows={4} placeholder="Notes on this week's review" />
                          </Field>
                        </FormDialog>
                      ) : (
                        <Button size="sm" variant="ghost">Review</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="gates">
          <SectionCard
            title="Faculty gates"
            description="Project gate verdicts and decisions"
            bodyClassName="flex flex-col divide-y divide-border"
          >
            {GATES.map((g) => (
              <div key={g.name} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 [&_svg]:size-4 ${g.iconClass}`}>{g.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{g.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.chipClass}`}>{g.verdict}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{g.detail}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ConfirmDialog
                    trigger={<Button size="sm">Approve</Button>}
                    title="Approve proposal?"
                    confirmLabel="Approve"
                    onConfirm={() => decideProposal(g.projectId, "APPROVED")}
                  />
                  <FormDialog
                    trigger={<Button size="sm" variant="outline">Revise</Button>}
                    title="Request revision"
                    submitLabel="Send for revision"
                    onSubmit={(data) =>
                      decideProposal(g.projectId, "REVISE_RESUBMIT", (data.get("feedback") as string) || undefined)
                    }
                  >
                    <Field label="Feedback" htmlFor="revise-feedback" hint="24h resubmission window">
                      <Textarea id="revise-feedback" name="feedback" rows={4} placeholder="What needs to change before resubmission?" />
                    </Field>
                  </FormDialog>
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="destructive">Reject</Button>}
                    title="Reject proposal?"
                    confirmLabel="Reject"
                    destructive
                    onConfirm={() => decideProposal(g.projectId, "REJECTED")}
                  />
                </div>
              </div>
            ))}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
