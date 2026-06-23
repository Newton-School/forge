import { getActiveDomain, getMyOrgRepo, getRepoDetail } from "@/lib/session";
import { MenteeRepoView as RepoView } from "@/components/github/repo/views";
import Link from "next/link";
import { GitBranch, Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { MilestoneBar } from "@/components/github/milestone-bar";
import { RepoDetailLive } from "@/components/github/repo-detail-live";
import {
  DEMO, ghTeam, ghRepo, GH_PROJECTS, milestonesForRepo, studentAnalytics, personName,
} from "@/lib/api";

export default async function MenteeRepository() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  // Production: the mentee's OWN team repo (resolved from the org roster) with live detail.
  const mine = await getMyOrgRepo();
  if (mine?.repo) {
    const detail = await getRepoDetail(mine.repo);
    if (detail) {
      return (
        <div className="flex flex-col gap-6">
          <PageHeader title="Your project repository" description={`${mine.team ?? mine.repo} · @${mine.login}`} />
          <RepoDetailLive data={detail} />
        </div>
      );
    }
  }

  const team = ghTeam(DEMO.teamId)!;
  const repo = ghRepo(team.repoId)!;
  const project = GH_PROJECTS.find((p) => p.teamIds.includes(team.id));
  const a = studentAnalytics(DEMO.menteeId);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hi ${personName(DEMO.menteeId).split(" ")[0]} — your project`}
        description={`${team.name} · ${repo.fullName}`}
        actions={<Button asChild size="sm"><Link href="/mentee/github/issues">Pick an issue</Link></Button>}
      />

      {project ? (
        <SectionCard title={project.name} description={project.objective} action={<Badge tone="primary">{project.status}</Badge>} bodyClassName="p-4">
          <p className="flex items-start gap-2 text-sm text-muted-foreground"><Target className="mt-0.5 size-4 shrink-0" /> {project.overview}</p>
        </SectionCard>
      ) : null}

      <SectionCard title="How you contribute" bodyClassName="overflow-x-auto p-4">
        <WorkflowPipeline />
      </SectionCard>

      <StatGrid>
        <StatCard label="Issues solved" value={a.issuesSolved} sub={`${a.issuesAttempted} attempted`} />
        <StatCard label="PRs merged" value={a.prsMerged} sub={`${a.prsRaised} raised`} />
        <StatCard label="Acceptance" value={`${a.acceptanceRate}%`} />
        <StatCard label="Commits" value={a.commits} icon={<GitBranch />} />
      </StatGrid>

      <SectionCard title="Milestones" description={repo.name} bodyClassName="divide-y divide-border">
        {milestonesForRepo(repo.id).map((m) => <MilestoneBar key={m.id} milestone={m} />)}
      </SectionCard>
    </div>
  );
}
