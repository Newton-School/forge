import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { IssueStateBadge } from "@/components/github/gh-badges";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { IssueFanout } from "@/components/github/issue-fanout";
import { ghIssue, ghRepo, prsForIssue, attemptsForIssue } from "@/lib/api";

export default async function IssueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = ghIssue(id);
  if (!issue) notFound();
  const repo = ghRepo(issue.repoId);
  const prs = prsForIssue(issue.id);
  const attempts = attemptsForIssue(issue.id);

  // Derive how far this issue is along the workflow.
  const current = issue.state === "closed" ? 7
    : prs.some((p) => p.state === "merged") ? 6
    : prs.some((p) => p.state === "open") ? 4
    : attempts.length ? 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`#${issue.number} ${issue.title}`}
        description={`${repo?.fullName}`}
        actions={<Link href="/github/workflow" className="flex items-center gap-1 text-xs text-primary hover:underline"><HelpCircle className="size-3.5" /> How this works</Link>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <IssueStateBadge state={issue.state} />
        {issue.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}
      </div>

      <SectionCard title="Description" bodyClassName="p-4">
        <p className="text-sm text-muted-foreground">{issue.body}</p>
      </SectionCard>

      <SectionCard title="Workflow" description="Where this issue is in the pipeline" bodyClassName="overflow-x-auto p-4">
        <WorkflowPipeline current={current} />
      </SectionCard>

      <SectionCard title="Attempts & pull requests" description="Multiple students can attempt the same issue — the mentor merges the best PR" bodyClassName="p-4">
        <IssueFanout issueId={issue.id} />
      </SectionCard>
    </div>
  );
}
