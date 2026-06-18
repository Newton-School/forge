import { getActiveDomain } from "@/lib/session";
import { MenteeAnalyticsView as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScorePips } from "@/components/github/gh-badges";
import { ReviewEvalCard } from "@/components/github/review-eval-card";
import { DEMO, studentAnalytics, GH_PRS, GH_REVIEWS, ghPR } from "@/lib/api";

export default async function MenteeAnalytics() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const a = studentAnalytics(DEMO.menteeId);
  const myPrIds = GH_PRS.filter((p) => p.authorId === DEMO.menteeId).map((p) => p.id);
  const myReviews = GH_REVIEWS.filter((r) => myPrIds.includes(r.prId));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contribution Analytics" description="Your GitHub throughput and how your mentor evaluates your learning" />

      <StatGrid>
        <StatCard label="Issues attempted" value={a.issuesAttempted} />
        <StatCard label="Issues solved" value={a.issuesSolved} />
        <StatCard label="PRs raised" value={a.prsRaised} />
        <StatCard label="PRs merged" value={a.prsMerged} />
        <StatCard label="Acceptance rate" value={`${a.acceptanceRate}%`} />
        <StatCard label="Commits" value={a.commits} />
        <StatCard label="Reviews received" value={a.reviewsReceived} />
        <StatCard label="Avg understanding" value={a.avgUnderstanding || "—"} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Learning evaluation (avg)" description="Mentors grade understanding, not just code" bodyClassName="flex flex-col gap-2 p-4">
          <ScorePips label="Understanding" score={Math.round(a.avgUnderstanding)} />
          <ScorePips label="Explanation" score={Math.round(a.avgExplanation)} />
          <ScorePips label="Technical depth" score={Math.round(a.avgTechnical)} />
        </SectionCard>
        <div className="flex flex-col gap-3 lg:col-span-2">
          {myReviews.map((r) => <ReviewEvalCard key={r.id} review={r} prTitle={`#${ghPR(r.prId)?.number} ${ghPR(r.prId)?.title}`} />)}
        </div>
      </div>
    </div>
  );
}
