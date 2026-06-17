import { GitBranch, Users, GitPullRequest, CircleDot, GitMerge, UsersRound } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { RepoCard } from "@/components/github/repo-card";
import { ActivityFeed } from "@/components/github/activity-feed";
import { TeamCompare } from "@/components/github/team-compare";
import { GH_REPOS, orgAnalytics, allTeamAnalytics } from "@/lib/api";

/** Read-only AI-org overview shared by the LCC and Admin dashboards. */
export function OrgOverview() {
  const a = orgAnalytics();
  return (
    <div className="flex flex-col gap-6">
      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Repositories" value={a.repos} icon={<GitBranch />} />
        <StatCard label="Teams" value={a.teams} icon={<UsersRound />} />
        <StatCard label="Contributors" value={a.contributors} icon={<Users />} />
        <StatCard label="Commits" value={a.commits} icon={<GitMerge />} />
        <StatCard label="Open issues" value={a.openIssues} sub={`${a.closedIssues} closed`} icon={<CircleDot />} />
        <StatCard label="Pull requests" value={a.prs} sub={`${a.mergedPrs} merged · ${a.openPrs} open`} icon={<GitPullRequest />} />
        <StatCard label="Merged PRs" value={a.mergedPrs} icon={<GitMerge />} />
        <StatCard label="Open PRs" value={a.openPrs} icon={<GitPullRequest />} />
      </StatGrid>

      <TeamCompare teams={allTeamAnalytics()} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Repositories" bodyClassName="grid gap-3 p-4 sm:grid-cols-2">
            {GH_REPOS.map((r) => <RepoCard key={r.id} repo={r} />)}
          </SectionCard>
        </div>
        <SectionCard title="Recent activity" bodyClassName="p-0"><ActivityFeed limit={10} /></SectionCard>
      </div>
    </div>
  );
}
