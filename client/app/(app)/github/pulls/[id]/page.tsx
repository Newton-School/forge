import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCommitHorizontal } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { PRStateBadge } from "@/components/github/gh-badges";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { ReviewEvalCard } from "@/components/github/review-eval-card";
import { PrReviewForm } from "@/components/github/pr-review-form";
import { ghPR, ghIssue, ghRepo, reviewForPR, personName } from "@/lib/api";

export default async function PrDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pr = ghPR(id);
  if (!pr) notFound();
  const issue = ghIssue(pr.issueId);
  const repo = ghRepo(pr.repoId);
  const review = reviewForPR(pr.id);
  const current = pr.state === "merged" ? 6 : pr.state === "rejected" ? 5 : 5;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`#${pr.number} ${pr.title}`} description={`${repo?.fullName} · by ${personName(pr.authorId)}`} />

      <div className="flex flex-wrap items-center gap-3">
        <PRStateBadge state={pr.state} />
        <span className="font-mono text-xs"><span className="text-success">+{pr.additions}</span> <span className="text-danger">−{pr.deletions}</span></span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><GitCommitHorizontal className="size-3.5" /> {pr.commits} commits</span>
        {issue ? <Link href={`/github/issues/${issue.id}`} className="text-xs text-primary hover:underline">Addresses #{issue.number} {issue.title}</Link> : null}
      </div>

      {pr.rejectionReason ? (
        <div className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
          <b>Rejected:</b> {pr.rejectionReason}
        </div>
      ) : null}

      <SectionCard title="Workflow" bodyClassName="overflow-x-auto p-4"><WorkflowPipeline current={current} /></SectionCard>

      <SectionCard title="Mentor review & learning evaluation" description="Mentors grade understanding, explanation and technical depth — not just code" bodyClassName="p-4">
        {review ? <ReviewEvalCard review={review} /> : <PrReviewForm prId={pr.id} />}
      </SectionCard>
    </div>
  );
}
