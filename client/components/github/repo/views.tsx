/**
 * Team-first, domain-adaptive repository-mode views (ML / DVA / SDSE).
 * Navigation is Domain → Team → Repository → Students → Contributions → Progress.
 *   • ML   → per-student independent repos (compare students within a team)
 *   • DVA / SDSE → one shared team repo
 * Data: team-first accessors (`repoDomainTeams` / `repoTeamGraph` / `repoTeamRepoDashboard`) —
 * mock in presentation, live server in production (DB summaries at the grid/overview, full
 * live repo data at the detail). AI keeps its org-mode pages; these render only for non-AI.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plug, Users, FolderGit2, GitBranch, Tag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  repoDomainTeams, repoTeamGraph, repoTeamRepoDashboard, primaryRepoOf, repoOfStudent, teamSummary,
  contributorStat, type RepoTeam,
} from "@/lib/api";
import { DOMAIN_META } from "@/lib/presentation";
import {
  TeamInfoHeader, TeamsGrid, StudentRepoGrid, RepoDetail,
} from "./team-blocks";
import { RepoPRList, RepoIssues, RepoMilestones, ContributorSummary } from "./blocks";

const domainName = (key: string) => DOMAIN_META[key as keyof typeof DOMAIN_META]?.name ?? key;

function NoTeams({ domain }: { domain: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="GitHub" description={`${domainName(domain)} · team-based`} />
      <EmptyState
        title="No teams connected"
        description="This domain tracks GitHub at the team level. Once teams connect their repositories, this dashboard fills with team activity."
        icon={<Plug />}
      />
      <div><Link href="/connections" className="text-sm text-primary underline">Go to Connections →</Link></div>
    </div>
  );
}

/** Domain rollup totals across teams (DB-available metrics — no live calls at the grid level). */
function DomainStats({ teams }: { teams: RepoTeam[] }) {
  const sums = teams.map(teamSummary);
  const total = (k: "repos" | "members" | "branches" | "releases") => sums.reduce((n, s) => n + s[k], 0);
  return (
    <StatGrid className="lg:grid-cols-4">
      <StatCard label="Teams" value={teams.length} sub={`${total("members")} students`} icon={<Users />} />
      <StatCard label="Repositories" value={total("repos")} sub="connected" icon={<FolderGit2 />} />
      <StatCard label="Branches" value={total("branches")} sub="across repos" icon={<GitBranch />} />
      <StatCard label="Releases" value={total("releases")} sub="tagged" icon={<Tag />} />
    </StatGrid>
  );
}

// ── Teacher / LCC / Admin — multi-team viewers (basePath = e.g. "/teacher/github") ──────

export async function RepoDomainDashboard({ domain, basePath }: { domain: string; basePath: string }) {
  const teams = await repoDomainTeams(domain);
  if (teams.length === 0) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${domainName(domain)} — GitHub`} description="Teams, repositories and contributions for this domain" />
      <DomainStats teams={teams} />
      <TeamsGrid teams={teams} basePath={basePath} />
    </div>
  );
}

export async function RepoTeamsList({ domain, basePath }: { domain: string; basePath: string }) {
  const teams = await repoDomainTeams(domain);
  if (teams.length === 0) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Teams" description={`${domainName(domain)} · select a team to view its repository and students`} />
      <TeamsGrid teams={teams} basePath={basePath} />
    </div>
  );
}

/** Team overview. ML → per-student repo grid (summaries); shared → the shared repo (live detail). */
export async function RepoTeamOverview({ teamId, basePath }: { teamId: string; basePath: string }) {
  const team = await repoTeamGraph(teamId);
  if (!team) notFound();
  if (team.repoModel === "per-student") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={team.name} description={`${domainName(team.domainKey)} · team overview`} />
        <TeamInfoHeader team={team} />
        <StudentRepoGrid team={team} basePath={basePath} />
      </div>
    );
  }
  // Shared model — load the team's repo in full (live) for the complete detail.
  const repo = await repoTeamRepoDashboard(teamId, primaryRepoOf(team).repoName);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={team.name} description={`${domainName(team.domainKey)} · team overview`} />
      {repo ? <RepoDetail team={team} repo={repo} /> : <TeamInfoHeader team={team} />}
    </div>
  );
}

/** Repository detail with full team context — ML one student's repo, or the shared team repo (live). */
export async function RepoRepositoryDetail({ teamId, repoName, basePath }: { teamId: string; repoName: string; basePath: string }) {
  const team = await repoTeamGraph(teamId);
  if (!team) notFound();
  const repo = await repoTeamRepoDashboard(teamId, repoName);
  if (!repo) notFound();
  const ownerStudent = team.members.find((m) => m.login === repo.ownerLogin);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ownerStudent && team.repoModel === "per-student" ? `${ownerStudent.name} — ${repo.repoName}` : repo.repoName}
        description={`${team.name} · ${domainName(team.domainKey)}`}
        actions={<Link href={`${basePath}/teams/${team.id}`} className="text-sm text-primary hover:underline">← Back to team</Link>}
      />
      <RepoDetail team={team} repo={repo} />
    </div>
  );
}

/** Domain-wide students — each team's roster + (per-student) repository grid. */
export async function RepoDomainStudents({ domain, basePath }: { domain: string; basePath: string }) {
  const teams = await repoDomainTeams(domain);
  if (teams.length === 0) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Contributions" description={`${domainName(domain)} · students and repositories across every team`} />
      {teams.map((team) => (
        <div key={team.id} className="flex flex-col gap-3">
          <Link href={`${basePath}/teams/${team.id}`} className="text-sm font-semibold text-primary hover:underline">{team.name} →</Link>
          <TeamInfoHeader team={team} />
          {team.repoModel === "per-student" ? <StudentRepoGrid team={team} basePath={basePath} /> : null}
        </div>
      ))}
    </div>
  );
}

// ── Mentor — their own team (presentation: first team of the domain) ────────────────────
async function mentorTeam(domain: string): Promise<RepoTeam | undefined> {
  return (await repoDomainTeams(domain))[0];
}

export async function MentorTeamHome({ domain, basePath }: { domain: string; basePath: string }) {
  const team = await mentorTeam(domain);
  if (!team) return <NoTeams domain={domain} />;
  if (team.repoModel === "per-student") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Team" description={`${team.name} · ${domainName(domain)}`} />
        <TeamInfoHeader team={team} />
        <StudentRepoGrid team={team} basePath={basePath} />
      </div>
    );
  }
  const repo = await repoTeamRepoDashboard(team.id, primaryRepoOf(team).repoName);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Team" description={`${team.name} · ${domainName(domain)}`} />
      {repo ? <RepoDetail team={team} repo={repo} /> : <TeamInfoHeader team={team} />}
    </div>
  );
}

export async function MentorTeamRepo({ domain, basePath }: { domain: string; basePath: string }) {
  const team = await mentorTeam(domain);
  if (!team) return <NoTeams domain={domain} />;
  if (team.repoModel === "per-student") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Repositories" description={`${team.name} · one repository per student`} />
        <StudentRepoGrid team={team} basePath={basePath} />
      </div>
    );
  }
  const repo = await repoTeamRepoDashboard(team.id, primaryRepoOf(team).repoName);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repository" description={`${team.name} · shared team repository`} />
      {repo ? <RepoDetail team={team} repo={repo} /> : <TeamInfoHeader team={team} />}
    </div>
  );
}

export async function MentorTeamStudents({ domain, basePath }: { domain: string; basePath: string }) {
  const team = await mentorTeam(domain);
  if (!team) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Performance" description={`${team.name} · students and repositories`} />
      <TeamInfoHeader team={team} />
      {team.repoModel === "per-student" ? <StudentRepoGrid team={team} basePath={basePath} /> : null}
    </div>
  );
}

export async function MentorTeamPRs({ domain }: { domain: string }) {
  const team = await mentorTeam(domain);
  if (!team) return <NoTeams domain={domain} />;
  const repo = await repoTeamRepoDashboard(team.id, primaryRepoOf(team).repoName);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pull Requests" description={`${team.name} · active, merged and pending review`} />
      {repo ? <RepoPRList conn={repo} /> : <EmptyState title="No pull requests" description="PRs appear here once the repository syncs." icon={<GitBranch />} />}
    </div>
  );
}

export async function MentorTeamIssues({ domain }: { domain: string }) {
  const team = await mentorTeam(domain);
  if (!team) return <NoTeams domain={domain} />;
  const repo = await repoTeamRepoDashboard(team.id, primaryRepoOf(team).repoName);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description={`${team.name} · open, assigned and closed`} />
      {repo ? <RepoIssues conn={repo} /> : <EmptyState title="No issues" description="Issues appear here when the repository uses them." icon={<GitBranch />} />}
    </div>
  );
}

// ── Mentee — their own repo (ML: own repo; shared: the team repo), loaded live ──────────
async function menteeRepoCtx(domain: string) {
  const team = (await repoDomainTeams(domain))[0];
  if (!team) return undefined;
  const summaryRepo = team.repoModel === "per-student"
    ? repoOfStudent(team, team.members[0]!.login) ?? primaryRepoOf(team)
    : primaryRepoOf(team);
  const repo = await repoTeamRepoDashboard(team.id, summaryRepo.repoName);
  return repo ? { team, repo } : undefined;
}

export async function MenteeRepoView({ domain }: { domain: string }) {
  const ctx = await menteeRepoCtx(domain);
  if (!ctx) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Repository" description={`${ctx.team.name} · ${domainName(domain)}`} />
      <RepoDetail team={ctx.team} repo={ctx.repo} />
    </div>
  );
}

export async function MenteePRsView({ domain }: { domain: string }) {
  const ctx = await menteeRepoCtx(domain);
  if (!ctx) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Pull Requests" description="PRs you've opened, merged or closed" />
      <RepoPRList conn={ctx.repo} authorLogin={ctx.repo.demoMentee} title="My Pull Requests" />
    </div>
  );
}

export async function MenteeAnalyticsView({ domain }: { domain: string }) {
  const ctx = await menteeRepoCtx(domain);
  if (!ctx) return <NoTeams domain={domain} />;
  const stat = contributorStat(ctx.repo, ctx.repo.demoMentee);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contribution Analytics" description="Your commits, pull requests and code changes" />
      {stat ? <ContributorSummary stat={stat} /> : null}
      <RepoPRList conn={ctx.repo} authorLogin={ctx.repo.demoMentee} title="My contributions" description="Pull requests authored" />
    </div>
  );
}

export async function MenteeMilestonesView({ domain }: { domain: string }) {
  const ctx = await menteeRepoCtx(domain);
  if (!ctx) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Milestones" description="Repository and portal milestones" />
      <RepoMilestones milestones={ctx.repo.milestones} portalNote />
    </div>
  );
}

export async function MenteeIssuesView({ domain }: { domain: string }) {
  const ctx = await menteeRepoCtx(domain);
  if (!ctx) return <NoTeams domain={domain} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description={ctx.repo.hasIssues ? "Open, assigned and closed issues" : "Issues are optional in this domain"} />
      <RepoIssues conn={ctx.repo} />
    </div>
  );
}
