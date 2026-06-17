import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { IssueFanout } from "@/components/github/issue-fanout";
import { ReviewEvalCard } from "@/components/github/review-eval-card";
import { GH_REVIEWS, ghPR } from "@/lib/api";

const STEPS = [
  ["Issue", "A unit of work is opened in the repo (a feature, fix or task)."],
  ["Self-Assign", "A student picks up the issue — no one assigns it to them."],
  ["Branch", "They create a branch off main to work in isolation."],
  ["Develop", "They commit their work, iterating until it's ready."],
  ["Pull Request", "They open a PR proposing their change against the issue."],
  ["Mentor Review", "The mentor reviews the code AND evaluates understanding."],
  ["Merge", "The best PR is merged; others are closed with reasons."],
  ["Milestone", "Merging moves the milestone — progress is real, not self-reported."],
];

/** A non-technical-readable explanation of the AI Domain's GitHub workflow. */
export default function WorkflowPage() {
  const sampleReview = GH_REVIEWS[0]!;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="How work flows in the AI Domain" description="GitHub is the source of truth — the portal makes it visible, mentorable and measurable." />

      <SectionCard title="The pipeline" bodyClassName="overflow-x-auto p-4"><WorkflowPipeline /></SectionCard>

      <SectionCard title="Step by step" bodyClassName="divide-y divide-border">
        {STEPS.map(([t, d], i) => (
          <div key={t} className="flex items-start gap-3 px-4 py-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
            <div><p className="text-sm font-medium">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Multiple students, one issue" description="The reality: several mentees attempt the same issue — the mentor merges the best PR and explains the rest" bodyClassName="p-4">
        <IssueFanout issueId="i-1" />
      </SectionCard>

      <SectionCard title="Mentors evaluate learning, not just code" description="Every review records whether the student can explain their work — kept historically" bodyClassName="p-4">
        <ReviewEvalCard review={sampleReview} prTitle={`#${ghPR(sampleReview.prId)?.number} ${ghPR(sampleReview.prId)?.title}`} />
      </SectionCard>
    </div>
  );
}
