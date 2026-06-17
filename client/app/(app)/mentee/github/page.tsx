import Link from "next/link";
import { GitBranch, Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowPipeline } from "@/components/github/workflow-pipeline";
import { MilestoneBar } from "@/components/github/milestone-bar";
import {
  DEMO, ghTeam, ghRepo, GH_PROJECTS, milestonesForRepo, studentAnalytics, personName,
} from "@/lib/api";

export default function MenteeRepository() {
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
