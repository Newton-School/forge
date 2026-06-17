import Link from "next/link";
import { GitBranch, CircleDot, GitPullRequest, GitCommitHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamAnalytics, teamOfRepo, type MockRepo } from "@/lib/api";

const DOC_LABELS: Record<string, string> = {
  readme: "README", devGuide: "Dev Guide", contributing: "Contributing", podGuide: "POD Guide", setup: "Setup",
};

/** Repository summary — the portal *surfaces* repo info, it doesn't duplicate GitHub. */
export function RepoCard({ repo }: { repo: MockRepo }) {
  const team = teamOfRepo(repo.id);
  const a = team ? teamAnalytics(team.id) : null;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/github/repos/${repo.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
            <GitBranch className="size-4 text-muted-foreground" /> {repo.name}
          </Link>
          <p className="truncate font-mono text-[11px] text-subtle-foreground">{repo.fullName}</p>
        </div>
        {team ? <Badge tone="info">{team.name}</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">{repo.description}</p>
      <div className="flex flex-wrap gap-1">
        {Object.entries(repo.docs).filter(([, v]) => v).map(([k]) => (
          <span key={k} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{DOC_LABELS[k]}</span>
        ))}
      </div>
      {a ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CircleDot className="size-3.5" /> {a.openIssues} open · {a.closedIssues} closed</span>
          <span className="flex items-center gap-1"><GitPullRequest className="size-3.5" /> {a.prs} PRs</span>
          <span className="flex items-center gap-1"><GitCommitHorizontal className="size-3.5" /> {a.commits} commits</span>
        </div>
      ) : null}
    </Card>
  );
}
