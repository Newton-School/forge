/**
 * Repository-mode presentational blocks (ML/DVA/SDSE). Each takes plain data and renders
 * with the shared dashboard primitives — no org/team assumptions. Reused across the
 * mentee / mentor / teacher repo dashboards.
 */
import {
  GitBranch, GitPullRequest, GitCommit, Tag, Users, Lock, Globe, Flag, Activity,
  CircleDot, ShieldCheck, FileDiff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BarChart } from "@/components/dashboard/bar-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials, shortDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/labels";
import {
  repoStats, repoContributors, repoActivity,
  type RepoConnection, type MockRepoPR, type MockRepoBranch, type MockRepoRelease,
  type MockRepoMilestone, type ContributorStat, type RepoActivityItem,
} from "@/lib/api";

const ROLE_TONE: Record<string, BadgeTone> = { owner: "info", maintainer: "warning", collaborator: "neutral" };
const PR_TONE: Record<MockRepoPR["state"], BadgeTone> = { open: "info", merged: "success", closed: "neutral" };
const REVIEW_TONE: Record<MockRepoPR["reviewState"], BadgeTone> = {
  approved: "success", changes_requested: "warning", pending: "info", none: "neutral",
};
const REVIEW_LABEL: Record<MockRepoPR["reviewState"], string> = {
  approved: "Approved", changes_requested: "Changes requested", pending: "Review pending", none: "—",
};

/** Repository header: name, owner, visibility, default branch, topics. */
export function RepoInfoCard({ conn }: { conn: RepoConnection }) {
  const owner = conn.collaborators.find((c) => c.login === conn.ownerLogin);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">{conn.fullName}</span>
            <Badge tone={conn.visibility === "private" ? "warning" : "neutral"} className="gap-1">
              {conn.visibility === "private" ? <Lock className="size-3" /> : <Globe className="size-3" />}
              {conn.visibility}
            </Badge>
          </div>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{conn.description}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {conn.topics.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
          </div>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">Owner</p>
          <div className="mt-1 flex items-center gap-2">
            <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(owner?.name ?? conn.ownerLogin)}</AvatarFallback></Avatar>
            <div>
              <div className="font-medium leading-tight">{owner?.name ?? conn.ownerLogin}</div>
              <div className="text-xs text-muted-foreground">{conn.ownerRole} · owns the repo</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Default branch <span className="font-mono text-foreground">{conn.defaultBranch}</span></p>
        </div>
      </div>
    </Card>
  );
}

/** Headline repo stats. `student` hides org/issue noise for the mentee self-view. */
export function RepoStatsRow({ conn }: { conn: RepoConnection }) {
  const s = repoStats(conn);
  return (
    <StatGrid className="lg:grid-cols-4">
      <StatCard label="Commits" value={s.commits} sub={`+${s.additions} / -${s.deletions}`} icon={<GitCommit />} />
      <StatCard label="Pull Requests" value={s.prs} sub={`${s.mergedPrs} merged · ${s.openPrs} open`} icon={<GitPullRequest />} />
      <StatCard label="Contributors" value={s.contributors} sub={`${conn.collaborators.length} collaborators`} icon={<Users />} />
      <StatCard label={conn.hasIssues ? "Open Issues" : "Releases"} value={conn.hasIssues ? s.openIssues : s.releases} sub={conn.hasIssues ? `${s.closedIssues} closed` : "tagged"} icon={conn.hasIssues ? <CircleDot /> : <Tag />} />
    </StatGrid>
  );
}

export function CollaboratorsList({ conn }: { conn: RepoConnection }) {
  return (
    <SectionCard title="Collaborators" description={`${conn.collaborators.length} people · owner + ${conn.collaborators.filter((c) => c.isStudent && c.repoRole !== "owner").length} students`} bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Person</TableHead>
            <TableHead>Portal role</TableHead>
            <TableHead>Repo role</TableHead>
            <TableHead className="pr-4">Permission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conn.collaborators.map((c) => (
            <TableRow key={c.login}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(c.name)}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-medium leading-tight">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">@{c.login}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell><Badge tone={c.portalRole === "Mentor" ? "info" : c.portalRole === "Team Lead" ? "warning" : "neutral"}>{c.portalRole}</Badge></TableCell>
              <TableCell><Badge tone={ROLE_TONE[c.repoRole]}>{c.repoRole}</Badge></TableCell>
              <TableCell className="pr-4 font-mono text-xs text-muted-foreground">{c.permission}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

export function BranchesList({ branches, defaultBranch }: { branches: MockRepoBranch[]; defaultBranch: string }) {
  return (
    <SectionCard title="Branches" description={`${branches.length} branches`} bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Branch</TableHead>
            <TableHead>Last commit</TableHead>
            <TableHead>Author</TableHead>
            <TableHead className="pr-4 text-right">Ahead / behind</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((b) => (
            <TableRow key={b.name}>
              <TableCell className="pl-4">
                <span className="font-mono text-sm">{b.name}</span>
                {b.name === defaultBranch && <Badge tone="neutral" className="ml-2">default</Badge>}
                {b.protected && <Badge tone="info" className="ml-1.5 gap-1"><ShieldCheck className="size-3" />protected</Badge>}
              </TableCell>
              <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{b.lastCommit}</TableCell>
              <TableCell className="text-sm">{b.author}</TableCell>
              <TableCell className="pr-4 text-right font-mono text-xs">
                <span className="text-success">↑{b.ahead}</span> <span className="text-muted-foreground">↓{b.behind}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

export function ReleasesList({ releases }: { releases: MockRepoRelease[] }) {
  if (releases.length === 0) return null;
  return (
    <SectionCard title="Releases" description={`${releases.length} published`} bodyClassName="p-4">
      <div className="flex flex-col gap-3">
        {releases.map((r) => (
          <div key={r.tag} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Tag className="mt-0.5 size-4 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{r.tag}</span>
                <span className="text-sm text-muted-foreground">{r.name}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.notes}</p>
              <p className="mt-1 text-xs text-subtle-foreground">{r.author} · {shortDate(r.publishedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function RepoActivityFeed({ conn, limit = 10 }: { conn: RepoConnection; limit?: number }) {
  const items: RepoActivityItem[] = repoActivity(conn, limit);
  const icon = (k: RepoActivityItem["kind"]) =>
    k === "commit" ? <GitCommit className="size-3.5 text-muted-foreground" />
    : k === "release" ? <Tag className="size-3.5 text-primary" />
    : k === "pr_merged" ? <GitPullRequest className="size-3.5 text-success" />
    : <GitPullRequest className="size-3.5 text-info" />;
  return (
    <SectionCard title="Repository activity" description="Most recent first" bodyClassName="p-4">
      <ol className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5">{icon(it.kind)}</span>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{it.who}</span>{" "}
              <span className="text-muted-foreground">{it.what}</span>
            </div>
            <span className="whitespace-nowrap text-xs text-subtle-foreground">{shortDate(it.when)}</span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

export function RepoMilestones({ milestones, portalNote }: { milestones: MockRepoMilestone[]; portalNote?: boolean }) {
  return (
    <SectionCard title="Milestones" description={portalNote ? "Repository + portal milestones" : "Repository milestones"} bodyClassName="p-4">
      <div className="flex flex-col gap-4">
        {milestones.map((m) => (
          <div key={m.title}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium"><Flag className="size-3.5 text-muted-foreground" />{m.title}</span>
              <span className="text-muted-foreground">{m.state === "closed" ? "Done" : `Due ${shortDate(m.dueAt)}`}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${m.progress === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${m.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/** PR table. Pass `authorLogin` to scope to one student's PRs (mentee "My Pull Requests"). */
export function RepoPRList({ conn, authorLogin, title, description }: { conn: RepoConnection; authorLogin?: string; title?: string; description?: string }) {
  const nameOf = (login: string) => conn.collaborators.find((c) => c.login === login)?.name ?? login;
  const prs = authorLogin ? conn.prs.filter((p) => p.authorLogin === authorLogin) : conn.prs;
  return (
    <SectionCard title={title ?? "Pull Requests"} description={description ?? `${prs.length} total · ${prs.filter((p) => p.state === "merged").length} merged`} bodyClassName="px-0">
      {prs.length === 0 ? (
        <EmptyState title="No pull requests yet" description="PRs will appear here as work is opened for review." icon={<GitPullRequest />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Pull Request</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Diff</TableHead>
              <TableHead>Review</TableHead>
              <TableHead className="pr-4">State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prs.map((p) => (
              <TableRow key={p.number}>
                <TableCell className="pl-4">
                  <span className="font-mono text-xs text-muted-foreground">#{p.number}</span>{" "}
                  <span className="font-medium">{p.title}</span>
                </TableCell>
                <TableCell className="text-sm">{nameOf(p.authorLogin)}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs"><span className="text-success">+{p.additions}</span> <span className="text-danger">-{p.deletions}</span></TableCell>
                <TableCell><Badge tone={REVIEW_TONE[p.reviewState]}>{REVIEW_LABEL[p.reviewState]}</Badge></TableCell>
                <TableCell className="pr-4"><Badge tone={PR_TONE[p.state]}>{p.state}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}

/** Issues table — or the "issues optional" empty state when the repo doesn't use them. */
export function RepoIssues({ conn, assignee }: { conn: RepoConnection; assignee?: string }) {
  if (!conn.hasIssues) {
    return (
      <SectionCard title="Issues" description="Optional for this domain" bodyClassName="p-4">
        <EmptyState
          title="This repository doesn't use GitHub Issues"
          description="Work in this domain is tracked through Tasks, Deliverables and Milestones in the drive. Issues will appear here automatically if the team starts using them."
          icon={<CircleDot />}
        />
      </SectionCard>
    );
  }
  const issues = assignee ? conn.issues.filter((i) => i.assignee === assignee) : conn.issues;
  return (
    <SectionCard title="Issues" description={`${issues.filter((i) => i.state === "open").length} open · ${issues.filter((i) => i.state === "closed").length} closed`} bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Issue</TableHead>
            <TableHead>Labels</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="pr-4">State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((i) => (
            <TableRow key={i.number}>
              <TableCell className="pl-4"><span className="font-mono text-xs text-muted-foreground">#{i.number}</span> <span className="font-medium">{i.title}</span></TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{i.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}</div></TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{i.assignee ? `@${i.assignee}` : "—"}</TableCell>
              <TableCell className="pr-4"><Badge tone={i.state === "open" ? "info" : "success"}>{i.state}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/** Per-contributor analytics table + a commits bar chart. Used by mentor/teacher. */
export function ContributionTable({ conn }: { conn: RepoConnection }) {
  const rows: ContributorStat[] = repoContributors(conn);
  const students = rows.filter((r) => r.isStudent);
  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Contribution analytics" description="Commits, PRs and code changes per collaborator" bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Contributor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Commits</TableHead>
              <TableHead className="text-right">PRs (merged)</TableHead>
              <TableHead className="text-right">Code (+/-)</TableHead>
              <TableHead className="pr-4 text-right">Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.login}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(r.name)}</AvatarFallback></Avatar>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </TableCell>
                <TableCell><Badge tone={r.portalRole === "Mentor" ? "info" : r.portalRole === "Team Lead" ? "warning" : "neutral"}>{r.portalRole}</Badge></TableCell>
                <TableCell className="text-right font-mono text-sm">{r.commits}</TableCell>
                <TableCell className="text-right font-mono text-sm">{r.prs} ({r.mergedPrs})</TableCell>
                <TableCell className="whitespace-nowrap text-right font-mono text-xs"><span className="text-success">+{r.additions}</span> <span className="text-danger">-{r.deletions}</span></TableCell>
                <TableCell className="pr-4 text-right text-muted-foreground">{shortDate(r.lastActive)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
      <SectionCard title="Commit distribution" description="Commits per student collaborator" bodyClassName="p-4">
        <BarChart suffix="" data={students.map((s) => ({ label: s.name, value: s.commits, tone: "primary" }))} />
      </SectionCard>
    </div>
  );
}

/** Single-contributor summary for the mentee self-view. */
export function ContributorSummary({ stat }: { stat: ContributorStat }) {
  return (
    <StatGrid className="lg:grid-cols-4">
      <StatCard label="My Commits" value={stat.commits} sub={`+${stat.additions} / -${stat.deletions}`} icon={<GitCommit />} />
      <StatCard label="My Pull Requests" value={stat.prs} sub={`${stat.mergedPrs} merged · ${stat.openPrs} open`} icon={<GitPullRequest />} />
      <StatCard label="Code Changes" value={stat.additions + stat.deletions} sub="lines touched" icon={<FileDiff />} />
      <StatCard label="Last Active" value={shortDate(stat.lastActive)} sub="most recent contribution" icon={<Activity />} />
    </StatGrid>
  );
}
