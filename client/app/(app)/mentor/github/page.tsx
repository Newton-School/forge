import Link from "next/link";
import { GitPullRequest, CircleDot, GitMerge, Users, Flag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { MilestoneBar } from "@/components/github/milestone-bar";
import { ActivityFeed } from "@/components/github/activity-feed";
import { PRList } from "@/components/github/pr-list";
import {
  DEMO, ghTeam, ghRepo, teamAnalytics, milestonesForRepo, prsForRepo,
} from "@/lib/api";

export default function MentorTeamDashboard() {
  const team = ghTeam(DEMO.teamId)!;
  const repo = ghRepo(team.repoId)!;
  const a = teamAnalytics(team.id);
  const reviewQueue = prsForRepo(team.repoId).filter((p) => p.state === "open");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${team.name} — Team Dashboard`}
        description={`Repo ${repo.fullName} · you mentor ${team.studentIds.length} students`}
        actions={<Button asChild size="sm"><Link href="/mentor/github/pulls">Review queue ({reviewQueue.length})</Link></Button>}
      />

      <StatGrid>
        <StatCard label="Members" value={a.members} icon={<Users />} />
        <StatCard label="Open issues" value={a.openIssues} sub={`${a.closedIssues} closed`} icon={<CircleDot />} />
        <StatCard label="PRs to review" value={reviewQueue.length} sub={`${a.prs} total`} icon={<GitPullRequest />} />
        <StatCard label="Merge rate" value={`${a.prMergeRate}%`} sub={`${a.mergedPrs} merged`} icon={<GitMerge />} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Review queue" description="Open PRs awaiting your review — the core mentor loop" bodyClassName="overflow-x-auto">
            <PRList prs={reviewQueue} action="review" />
          </SectionCard>
          <SectionCard title="Milestones" description={`${repo.name} progress`} bodyClassName="divide-y divide-border">
            {milestonesForRepo(repo.id).map((m) => <MilestoneBar key={m.id} milestone={m} />)}
          </SectionCard>
        </div>
        <SectionCard title="Team activity" bodyClassName="p-0"><ActivityFeed limit={8} /></SectionCard>
      </div>
    </div>
  );
}
