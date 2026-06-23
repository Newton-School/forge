import { notFound } from "next/navigation";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MilestoneBar } from "@/components/github/milestone-bar";
import { IssueList } from "@/components/github/issue-list";
import { PRList } from "@/components/github/pr-list";
import { RepoDetailLive } from "@/components/github/repo-detail-live";
import { getRepoDetail } from "@/lib/session";
import { initials } from "@/lib/utils";
import {
  ghRepo, teamOfRepo, ghPerson, personName, milestonesForRepo, issuesForRepo, prsForRepo,
} from "@/lib/api";

const DOC_LABELS: Record<string, string> = {
  readme: "README", devGuide: "Dev Guide", contributing: "Contributing", podGuide: "POD Guide", setup: "Setup",
};

export default async function RepoDetail({ params }: { params: Promise<{ repo: string }> }) {
  const { repo: repoId } = await params;

  // Production: real repo detail from the GitHub org (repoId is the live repo name). The dashboard
  // links here, so this must read live. Presentation/offline: the mock fixture below.
  const live = await getRepoDetail(repoId);
  if (live) return <RepoDetailLive data={live} />;

  const repo = ghRepo(repoId);
  if (!repo) notFound();
  const team = teamOfRepo(repo.id);
  const contributors = team ? [team.mentorId, ...team.studentIds] : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={repo.name} description={repo.fullName} />

      <SectionCard title="Overview" description={repo.description} bodyClassName="flex flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <GitBranch className="size-3.5" /> <code className="rounded bg-muted px-1">{repo.defaultBranch}</code>
          {repo.topics.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
          {team ? <Badge tone="info">{team.name}</Badge> : null}
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(repo.docs).map(([k, v]) => (
            <span key={k} className={`rounded border px-1.5 py-0.5 text-[10px] ${v ? "border-success/30 bg-success-bg text-success" : "border-border text-subtle-foreground line-through"}`}>{DOC_LABELS[k]}</span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Contributors:</span>
          {contributors.map((id) => {
            const p = ghPerson(id);
            return (
              <span key={id} className="flex items-center gap-1.5">
                <Avatar className="size-6"><AvatarFallback style={{ background: p?.color, color: "white", fontSize: 10 }}>{initials(personName(id))}</AvatarFallback></Avatar>
                <span className="text-xs">{personName(id)}{id === team?.mentorId ? " (mentor)" : ""}</span>
              </span>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Milestones" bodyClassName="divide-y divide-border">
        {milestonesForRepo(repo.id).map((m) => <MilestoneBar key={m.id} milestone={m} />)}
      </SectionCard>

      <SectionCard title="Issues" bodyClassName="overflow-x-auto"><IssueList issues={issuesForRepo(repo.id)} /></SectionCard>
      <SectionCard title="Pull requests" bodyClassName="overflow-x-auto"><PRList prs={prsForRepo(repo.id)} /></SectionCard>
    </div>
  );
}
