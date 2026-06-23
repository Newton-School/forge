import { GitBranch, GitCommit, Users, CircleDot, GitPullRequest } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import type { RepoDetailLiveDto } from "@/lib/session";

const prTone = (s: string) => (s === "merged" ? "primary" : s === "rejected" ? "danger" : "success");

const IN_PROGRESS = /in.?progress|in.?review|working|wip|doing|started/i;

/** AI-org repo detail rendered from REAL GitHub reads (`/integrations/github/repos/:repo`). */
export function RepoDetailLive({ data }: { data: RepoDetailLiveDto }) {
  const openIssues = data.issues.filter((i) => i.state === "open").length;
  const closedIssues = data.issues.filter((i) => i.state === "closed").length;
  // "In progress" isn't a native GitHub state — derive it from a label on open issues.
  const inProgress = data.issues.filter((i) => i.state === "open" && i.labels.some((l) => IN_PROGRESS.test(l))).length;
  const totalIssues = data.issues.length;
  const openPrs = data.pulls.filter((p) => p.state === "open").length;
  const mergedPrs = data.pulls.filter((p) => p.state === "merged").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={data.repo} description="Live GitHub repository · org read-through" />

      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Commits" value={data.commits} icon={<GitCommit />} />
        <StatCard label="Contributors" value={data.contributors.length} icon={<Users />} />
        <StatCard
          label="Issues"
          value={totalIssues}
          sub={`${openIssues} open · ${closedIssues} closed${inProgress ? ` · ${inProgress} in progress` : ""}`}
          icon={<CircleDot />}
        />
        <StatCard
          label="Pull requests"
          value={data.pulls.length}
          sub={`${openPrs} open · ${mergedPrs} merged`}
          icon={<GitPullRequest />}
        />
      </StatGrid>

      <SectionCard title="Contributors" bodyClassName="flex flex-wrap gap-2 p-4">
        {data.contributors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributors with activity yet.</p>
        ) : (
          data.contributors.map((login) => (
            <span key={login} className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
              <Avatar className="size-6"><AvatarFallback className="text-[10px]">{initials(login)}</AvatarFallback></Avatar>
              <span className="text-xs">{login}</span>
            </span>
          ))
        )}
      </SectionCard>

      <SectionCard title="Commit history" description={`${data.commits} total · showing latest ${data.commitList.length}`} bodyClassName="p-0">
        {data.commitList.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No commits yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.commitList.map((c) => (
              <li key={c.sha} className="flex items-start gap-3 px-4 py-2.5">
                <GitCommit className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{c.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.author ?? "unknown"}
                    {c.date ? ` · ${new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
                <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-subtle-foreground">{c.sha}</code>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Milestones" bodyClassName="divide-y divide-border">
        {data.milestones.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No milestones.</p>
        ) : (
          data.milestones.map((m) => (
            <div key={m.number} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.title}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
              <Badge tone={m.state === "closed" ? "neutral" : "info"}>{m.progress}%</Badge>
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard title="Issues" bodyClassName="p-0">
        {data.issues.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No issues.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">#</th><th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Author</th><th className="px-4 py-2 font-medium">State</th>
              </tr></thead>
              <tbody>
                {data.issues.map((i) => (
                  <tr key={i.number} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2 tabular-nums text-subtle-foreground">{i.number}</td>
                    <td className="px-4 py-2"><a href={i.url} target="_blank" rel="noreferrer" className="hover:underline">{i.title}</a></td>
                    <td className="px-4 py-2 text-muted-foreground">{i.author ?? "—"}</td>
                    <td className="px-4 py-2"><Badge tone={i.state === "open" ? "success" : "neutral"}>{i.state}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Pull requests" bodyClassName="p-0">
        {data.pulls.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No pull requests.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">#</th><th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Author</th><th className="px-4 py-2 font-medium">State</th>
              </tr></thead>
              <tbody>
                {data.pulls.map((p) => (
                  <tr key={p.number} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2 tabular-nums text-subtle-foreground">{p.number}</td>
                    <td className="px-4 py-2"><a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a></td>
                    <td className="px-4 py-2 text-muted-foreground">{p.author ?? "—"}</td>
                    <td className="px-4 py-2"><Badge tone={prTone(p.state)}>{p.state}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
