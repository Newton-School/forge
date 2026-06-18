/**
 * Team-first presentational blocks for the non-AI GitHub dashboards.
 * Everything is navigated Domain → Team → Repository → Students → Contributions → Progress.
 * The repo structure is domain-adaptive: ML = per-student independent repos; DVA/SDSE = one
 * shared team repo. These compose the lower-level repo blocks in `./blocks`.
 */
import Link from "next/link";
import { GitBranch, GitCommit, GitPullRequest, Users, Crown, GraduationCap, Flag, Boxes, Package, Tag, FolderGit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials, shortDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/labels";
import {
  repoStats, teamSummary, teamStudentContributions, teamStudentRepoSummaries, teamActivity,
  type RepoTeam, type RepoConnection, type TeamPerson, type MockRepoDeliverable,
} from "@/lib/api";
import {
  RepoInfoCard, RepoStatsRow, BranchesList, ReleasesList, RepoMilestones, RepoPRList, RepoIssues, RepoActivityFeed,
} from "./blocks";

const MODEL_LABEL: Record<string, string> = { "per-student": "Per-student repositories", shared: "Shared team repository", org: "Organization" };
const DELIV_TONE: Record<MockRepoDeliverable["status"], BadgeTone> = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" };

function PersonChip({ p, label }: { p: TeamPerson; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7"><AvatarFallback className="text-[10px]" style={{ background: p.color, color: "white" }}>{initials(p.name)}</AvatarFallback></Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium leading-tight">{p.name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{label ?? `@${p.login}`}</div>
      </div>
    </div>
  );
}

/** Team context header — mentor, student team lead, and members. Shown atop every team/repo page. */
export function TeamInfoHeader({ team }: { team: RepoTeam }) {
  const others = team.members.filter((m) => m.login !== team.teamLead.login);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-base font-semibold">{team.name}</span>
            <Badge tone="info">{team.domainKey}</Badge>
            <Badge tone="neutral">{MODEL_LABEL[team.repoModel]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{team.members.length} students · {team.repos.length} {team.repos.length === 1 ? "repository" : "repositories"}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground"><GraduationCap className="size-3" /> Mentor</p>
          <PersonChip p={team.mentor} label="Faculty mentor" />
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground"><Crown className="size-3" /> Team Lead</p>
          <PersonChip p={team.teamLead} label="Student lead" />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">Members</p>
          <div className="flex flex-wrap gap-3">
            {others.map((m) => <PersonChip key={m.login} p={m} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Domain → Teams grid (the team-first entry point). Cards link to the team overview. */
export function TeamsGrid({ teams, basePath }: { teams: RepoTeam[]; basePath: string }) {
  return (
    <SectionCard title="Teams" description={`${teams.length} teams in this domain`} bodyClassName="p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const r = teamSummary(team);
          return (
            <Link key={team.id} href={`${basePath}/teams/${team.id}`} className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{team.name}</span>
                <Badge tone="neutral">{team.repoModel === "per-student" ? `${r.repos} repos` : "shared repo"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Mentor {team.mentor.name} · Lead {team.teamLead.name}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="size-3.5" />{r.members}</span>
                <span className="flex items-center gap-1"><FolderGit2 className="size-3.5" />{r.repos}</span>
                <span className="flex items-center gap-1"><GitBranch className="size-3.5" />{r.branches}</span>
                <span className="flex items-center gap-1"><Tag className="size-3.5" />{r.releases}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}

/** ML per-student independent repositories — compare students within a team. Cards drill into a repo. */
export function StudentRepoGrid({ team, basePath }: { team: RepoTeam; basePath: string }) {
  const summaries = teamStudentRepoSummaries(team);
  return (
    <SectionCard title="Student repositories" description={`${team.repos.length} independent repos · one per student · open a repo for full activity`} bodyClassName="p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((c) => (
          <Link key={c.person.login} href={`${basePath}/teams/${team.id}/repos/${c.repoName}`} className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8"><AvatarFallback className="text-[11px]" style={{ background: c.person.color, color: "white" }}>{initials(c.person.name)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{c.person.name}{c.person.login === team.teamLead.login ? <span className="ml-1.5 text-[10px] text-warning">(lead)</span> : null}</div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">{c.repoName}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div><div className="font-mono text-sm font-medium">{c.branches}</div><div className="text-subtle-foreground">branches</div></div>
              <div><div className="font-mono text-sm font-medium">{c.releases}</div><div className="text-subtle-foreground">releases</div></div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

/** Repo deliverables (drive-tracked) — progress alongside milestones. */
export function RepoDeliverables({ deliverables }: { deliverables: MockRepoDeliverable[] }) {
  if (deliverables.length === 0) return null;
  return (
    <SectionCard title="Deliverables" description={`${deliverables.length} submitted`} bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Deliverable</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Submitted by</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliverables.map((d) => (
            <TableRow key={d.name}>
              <TableCell className="pl-4 font-medium"><span className="flex items-center gap-2"><Package className="size-3.5 text-muted-foreground" />{d.name}</span></TableCell>
              <TableCell className="text-muted-foreground">{d.type}</TableCell>
              <TableCell className="text-muted-foreground">{d.submittedBy} · {shortDate(d.submittedAt)}</TableCell>
              <TableCell className="pr-4"><Badge tone={DELIV_TONE[d.status]}>{d.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/** Full repository detail WITH team context — Team Info · Repo Info · GitHub Activity · Progress. */
export function RepoDetail({ team, repo }: { team: RepoTeam; repo: RepoConnection }) {
  const s = repoStats(repo);
  return (
    <div className="flex flex-col gap-6">
      <TeamInfoHeader team={team} />

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><GitBranch className="size-4" /> Repository</h3>
        <div className="flex flex-col gap-6">
          <RepoInfoCard conn={repo} />
          <RepoStatsRow conn={repo} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Boxes className="size-4" /> GitHub activity</h3>
        <StatGrid className="mb-6 lg:grid-cols-4">
          <StatCard label="Commits" value={s.commits} sub={`+${s.additions} / -${s.deletions}`} icon={<GitCommit />} />
          <StatCard label="Pull Requests" value={s.prs} sub={`${s.mergedPrs} merged · ${s.openPrs} open`} icon={<GitPullRequest />} />
          <StatCard label="Branches" value={s.branches} sub="active" icon={<GitBranch />} />
          <StatCard label="Releases" value={s.releases} sub="tagged" icon={<Package />} />
        </StatGrid>
        <div className="grid gap-6 lg:grid-cols-2">
          <RepoActivityFeed conn={repo} />
          <BranchesList branches={repo.branches} defaultBranch={repo.defaultBranch} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RepoPRList conn={repo} />
          <ReleasesList releases={repo.releases} />
        </div>
        {repo.hasIssues ? <div className="mt-6"><RepoIssues conn={repo} /></div> : null}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Flag className="size-4" /> Progress</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <RepoMilestones milestones={repo.milestones} portalNote />
          <RepoDeliverables deliverables={repo.deliverables} />
        </div>
      </div>
    </div>
  );
}

/** Compact team-level activity feed (merged across the team's repos). */
export function TeamActivityFeed({ team, limit = 10 }: { team: RepoTeam; limit?: number }) {
  const items = teamActivity(team, limit);
  return (
    <SectionCard title="Team activity" description="Across the team's repositories" bodyClassName="p-4">
      <ol className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5"><GitCommit className="size-3.5 text-muted-foreground" /></span>
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

/** Per-student contribution table for a team (works for both per-student and shared models). */
export function TeamStudentTable({ team, basePath }: { team: RepoTeam; basePath?: string }) {
  const rows = teamStudentContributions(team);
  return (
    <SectionCard title="Student contributions" description="Commits, PRs and progress per student" bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Student</TableHead>
            <TableHead>Repository</TableHead>
            <TableHead className="text-right">Commits</TableHead>
            <TableHead className="text-right">PRs (merged)</TableHead>
            <TableHead className="text-right">Progress</TableHead>
            <TableHead className="pr-4 text-right">Last active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.person.login}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7"><AvatarFallback className="text-[10px]" style={{ background: r.person.color, color: "white" }}>{initials(r.person.name)}</AvatarFallback></Avatar>
                  <span className="font-medium">{r.person.name}</span>
                  {r.person.login === team.teamLead.login ? <Badge tone="warning">lead</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {basePath && team.repoModel === "per-student"
                  ? <Link href={`${basePath}/teams/${team.id}/repos/${r.repoName}`} className="text-primary hover:underline">{r.repoName}</Link>
                  : r.repoName}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">{r.commits}</TableCell>
              <TableCell className="text-right font-mono text-sm">{r.prs} ({r.mergedPrs})</TableCell>
              <TableCell className="text-right font-mono text-sm">{r.milestoneProgress}%</TableCell>
              <TableCell className="pr-4 text-right text-muted-foreground">{r.lastActive === "—" ? "—" : shortDate(r.lastActive)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
