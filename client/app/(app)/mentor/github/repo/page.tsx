import { getActiveDomain } from "@/lib/session";
import { MentorTeamRepo as RepoView } from "@/components/github/repo/views";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { MilestoneBar } from "@/components/github/milestone-bar";
import { IssueList } from "@/components/github/issue-list";
import { DEMO, ghTeam, ghRepo, milestonesForRepo, issuesForRepo } from "@/lib/api";

const DOC_LABELS: Record<string, string> = {
  readme: "README", devGuide: "Dev Guide", contributing: "Contributing", podGuide: "POD Guide", setup: "Setup",
};

export default async function MentorRepo() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/mentor/github" />;

  const team = ghTeam(DEMO.teamId)!;
  const repo = ghRepo(team.repoId)!;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={repo.name} description={repo.description} />

      <SectionCard title="Repository" description={repo.fullName} bodyClassName="flex flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <GitBranch className="size-3.5" /> default branch <code className="rounded bg-muted px-1">{repo.defaultBranch}</code>
          {repo.topics.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(repo.docs).map(([k, v]) => (
            <span key={k} className={`rounded border px-1.5 py-0.5 text-[10px] ${v ? "border-success/30 bg-success-bg text-success" : "border-border text-subtle-foreground line-through"}`}>{DOC_LABELS[k]}</span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Milestones" bodyClassName="divide-y divide-border">
        {milestonesForRepo(repo.id).map((m) => <MilestoneBar key={m.id} milestone={m} />)}
      </SectionCard>

      <SectionCard title="Issues" description="Unit of work — click an issue to see who attempted it" bodyClassName="overflow-x-auto">
        <IssueList issues={issuesForRepo(repo.id)} />
      </SectionCard>
    </div>
  );
}
