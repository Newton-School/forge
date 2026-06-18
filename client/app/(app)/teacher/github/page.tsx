import { getActiveDomain } from "@/lib/session";
import { TeacherRepoHome as RepoView } from "@/components/github/repo/views";
import Link from "next/link";
import { GitBranch, Users, GitPullRequest, CircleDot, GitMerge, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { RepoCard } from "@/components/github/repo-card";
import { ActivityFeed } from "@/components/github/activity-feed";
import { GH_ORG, GH_REPOS, orgAnalytics } from "@/lib/api";

export default async function TeacherOrgDashboard() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const a = orgAnalytics();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Domain — Org Dashboard"
        description={`GitHub org @${GH_ORG.login} · GitHub is the source of truth`}
        actions={<Button asChild size="sm" variant="outline"><Link href="/teacher/github/teams">Compare teams</Link></Button>}
      />

      <SectionCard title="How work flows" description="Every contribution follows this path — issues drive milestones" bodyClassName="overflow-x-auto p-4">
        <WorkflowPipeline />
      </SectionCard>

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Repositories" description={`${GH_REPOS.length} repos across the org`} bodyClassName="grid gap-3 p-4 sm:grid-cols-2">
            {GH_REPOS.map((r) => <RepoCard key={r.id} repo={r} />)}
          </SectionCard>
        </div>
        <SectionCard title="Recent activity" description="Commits & PR events" bodyClassName="p-0">
          <ActivityFeed limit={10} />
        </SectionCard>
      </div>
    </div>
  );
}
