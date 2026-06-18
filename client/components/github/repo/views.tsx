/**
 * Composed repository-mode views (ML/DVA/SDSE), one per GitHub dashboard sub-page.
 * Each takes the active `domain`, resolves its connected repo, and arranges the blocks.
 * Presentational + server-friendly. AI keeps its org-mode pages; these render for non-AI.
 */
import Link from "next/link";
import { GitBranch, Plug } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  repoDashboard, contributorStat, repoStats, domainRepoAnalytics,
  type RepoConnection,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { DOMAIN_META } from "@/lib/presentation";
import {
  RepoInfoCard, RepoStatsRow, CollaboratorsList, BranchesList, ReleasesList,
  RepoActivityFeed, RepoMilestones, RepoPRList, RepoIssues, ContributionTable, ContributorSummary,
} from "./blocks";

const domainName = (key: string) => DOMAIN_META[key as keyof typeof DOMAIN_META]?.name ?? key;

/** Shown when a non-AI domain has no repository connected yet. */
function NoRepo({ domain }: { domain: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="GitHub" description={`${domainName(domain)} · repository-based`} />
      <EmptyState
        title="No repository connected"
        description="This domain tracks GitHub at the repository level. A mentor or team lead can connect the team repository from Connections — then this dashboard fills with activity."
        icon={<Plug />}
      />
      <div><Link href="/connections" className="text-sm text-primary underline">Go to Connections →</Link></div>
    </div>
  );
}

const mentorLoginOf = (conn: RepoConnection) =>
  conn.collaborators.find((c) => c.portalRole === "Mentor")?.login ?? conn.ownerLogin;

// ── Mentee ───────────────────────────────────────────────────────────────────────
export async function MenteeRepoHome({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  const me = conn.collaborators.find((c) => c.login === conn.demoMentee);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Repository" description={`${conn.team} · ${domainName(domain)}`} />
      <RepoInfoCard conn={conn} />
      <RepoStatsRow conn={conn} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CollaboratorsList conn={conn} />
        <RepoActivityFeed conn={conn} />
      </div>
      <BranchesList branches={conn.branches} defaultBranch={conn.defaultBranch} />
      {me && <p className="text-xs text-subtle-foreground">Signed in as <span className="font-mono">@{me.login}</span> · {me.permission} access.</p>}
    </div>
  );
}

export async function MenteeIssues({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description={conn.hasIssues ? "Open, assigned and closed issues" : "Issues are optional in this domain"} />
      <RepoIssues conn={conn} />
    </div>
  );
}

export async function MenteePRs({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Pull Requests" description="PRs you've opened, merged or closed" />
      <RepoPRList conn={conn} authorLogin={conn.demoMentee} title="My Pull Requests" />
    </div>
  );
}

export async function MenteeAnalytics({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  const stat = contributorStat(conn, conn.demoMentee);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contribution Analytics" description="Your commits, pull requests and code changes" />
      {stat ? <ContributorSummary stat={stat} /> : null}
      <RepoPRList conn={conn} authorLogin={conn.demoMentee} title="My contributions" description="Pull requests authored" />
    </div>
  );
}

export async function MenteeMilestones({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Milestones" description="Repository and portal milestones" />
      <RepoMilestones milestones={conn.milestones} portalNote />
    </div>
  );
}

// ── Mentor ───────────────────────────────────────────────────────────────────────
export async function MentorRepoHome({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  const s = repoStats(conn);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Team Dashboard" description={`${conn.team} · ${domainName(domain)}`} />
      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Collaborators" value={conn.collaborators.length} sub={`${conn.collaborators.filter((c) => c.isStudent).length} students`} />
        <StatCard label="Open PRs" value={s.openPrs} sub={`${s.mergedPrs} merged`} />
        <StatCard label="Commits" value={s.commits} sub="this drive" />
        <StatCard label="Milestone" value={`${conn.milestones.find((m) => m.state === "open")?.progress ?? 100}%`} sub="current milestone" />
      </StatGrid>
      <div className="grid gap-6 lg:grid-cols-2">
        <RepoMilestones milestones={conn.milestones} portalNote />
        <RepoActivityFeed conn={conn} />
      </div>
    </div>
  );
}

export async function MentorRepo({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repository" description="Health, contributors, branches and releases" />
      <RepoInfoCard conn={conn} />
      <RepoStatsRow conn={conn} />
      <CollaboratorsList conn={conn} />
      <div className="grid gap-6 lg:grid-cols-2">
        <BranchesList branches={conn.branches} defaultBranch={conn.defaultBranch} />
        <ReleasesList releases={conn.releases} />
      </div>
      <RepoActivityFeed conn={conn} />
    </div>
  );
}

export async function MentorIssues({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description={conn.hasIssues ? "Open, assigned and closed" : "Issues are optional in this domain"} />
      <RepoIssues conn={conn} />
    </div>
  );
}

export async function MentorPRs({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  const pending = conn.prs.filter((p) => p.state === "open" && (p.reviewState === "pending" || p.reviewState === "changes_requested"));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pull Requests" description="Active, merged and pending review" />
      {pending.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning-bg/40 px-4 py-3 text-sm text-warning">
          <strong>{pending.length}</strong> pull request{pending.length > 1 ? "s" : ""} awaiting your review.
        </div>
      )}
      <RepoPRList conn={conn} />
    </div>
  );
}

export async function MentorStudents({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Performance" description="Contribution analytics across the team repository" />
      <ContributionTable conn={conn} />
    </div>
  );
}

// ── Teacher / LCC / Admin ──────────────────────────────────────────────────────────
/** Cross-domain rollup of every repository-based domain (teacher context). */
function RepoRollup() {
  const rows = domainRepoAnalytics();
  return (
    <SectionCard title="Repository-based domains" description="Every connected team repository" bodyClassName="px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Domain</TableHead>
            <TableHead>Repository</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Commits</TableHead>
            <TableHead className="text-right">PRs</TableHead>
            <TableHead className="pr-4 text-right">Contributors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ conn, stats }) => (
            <TableRow key={conn.domainKey}>
              <TableCell className="pl-4"><Badge tone="info">{conn.domainKey}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{conn.fullName}</TableCell>
              <TableCell className="text-sm">{conn.ownerRole}</TableCell>
              <TableCell className="text-right font-mono text-sm">{stats.commits}</TableCell>
              <TableCell className="text-right font-mono text-sm">{stats.prs}</TableCell>
              <TableCell className="pr-4 text-right font-mono text-sm">{stats.contributors}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

export async function TeacherRepoHome({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repository Analytics" description={`${domainName(domain)} · repository-based domain`} />
      <RepoInfoCard conn={conn} />
      <RepoStatsRow conn={conn} />
      <ContributionTable conn={conn} />
      <RepoRollup />
    </div>
  );
}

export async function TeacherRepos({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repositories" description="Connected team repositories across repository-based domains" />
      <RepoRollup />
      <RepoInfoCard conn={conn} />
      <RepoActivityFeed conn={conn} />
    </div>
  );
}

export async function TeacherStudents({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Contributions" description={`${domainName(domain)} · participation across the repository`} />
      <ContributionTable conn={conn} />
    </div>
  );
}

/** LCC/Admin domain overview (repo-mode). */
export async function RepoDomainOverview({ domain }: { domain: string }) {
  const user = await getCurrentUser();
  const conn = await repoDashboard({ domain, teamId: user.teamId });
  if (!conn) return <NoRepo domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${domainName(domain)} — GitHub`} description="Repository-based domain overview" />
      <RepoInfoCard conn={conn} />
      <RepoStatsRow conn={conn} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CollaboratorsList conn={conn} />
        <RepoActivityFeed conn={conn} />
      </div>
      <RepoRollup />
    </div>
  );
}
