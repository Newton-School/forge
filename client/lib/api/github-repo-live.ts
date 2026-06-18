/**
 * Production mappers for the team-first GitHub endpoints → the UI's RepoTeam / RepoConnection.
 *
 * The `/domain-teams` and `/teams/:id/graph` endpoints return DB-available SUMMARIES (roster +
 * repo counts: collaborators / branches / releases) — NOT commits/PRs (those need a live GitHub
 * call). So summary repos are built with count-length placeholder arrays (never rendered, only
 * counted by the grid); full per-repo data comes from the per-repo dashboard endpoint at detail.
 */
import type {
  RepoTeam, RepoConnection, TeamPerson, RepoModel,
  MockRepoBranch, MockRepoRelease, MockCollaborator,
} from "@/lib/mock/github-repo";

const PALETTE = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#db2777", "#7c3aed", "#0891b2"];

export interface GraphPersonDto { userId?: string; name: string; login: string | null; role?: "TeamLead" | "Mentee" }
export interface GraphRepoDto {
  name: string; fullName: string; owner: string; ownerUserId: string | null;
  ownerRole: "owner" | "maintainer" | "collaborator"; visibility: "public" | "private";
  hasIssues: boolean; description: string | null; defaultBranch: string;
  collaborators: number; branches: number; releases: number;
}
export interface GraphTeamDto {
  id: string; name: string; domainKey: string | null; repoModel: RepoModel;
  mentor: { name: string; login: string | null } | null;
  teamLead: GraphPersonDto | null;
  members: GraphPersonDto[];
  repos: GraphRepoDto[];
}
export interface DomainTeamsDto { domainKey: string; repoModel: RepoModel; teams: GraphTeamDto[] }

const person = (p: { name: string; login: string | null }, role: TeamPerson["role"], i: number): TeamPerson => ({
  login: p.login ?? "—",
  name: p.name,
  role,
  color: PALETTE[i % PALETTE.length]!,
});

/** Count-length placeholder arrays so the grid's `.length`-based metrics are correct. */
const fill = <T>(n: number, make: () => T): T[] => Array.from({ length: n }, make);

/** A summary repo (counts only) — full commits/PRs/activity load lazily at the detail view. */
function summaryRepo(domainKey: string, teamName: string, r: GraphRepoDto): RepoConnection {
  const branches: MockRepoBranch[] = fill(r.branches, () => ({ name: "", protected: false, ahead: 0, behind: 0, lastCommit: "", author: "", updatedAt: "" }));
  const releases: MockRepoRelease[] = fill(r.releases, () => ({ tag: "", name: "", publishedAt: "", author: "", notes: "" }));
  const collaborators: MockCollaborator[] = fill(r.collaborators, () => ({ login: "", name: "", repoRole: "collaborator", permission: "read", portalRole: "Mentee", isStudent: true, color: PALETTE[0]! }));
  return {
    domainKey, team: teamName,
    repoName: r.name, fullName: r.fullName, description: r.description ?? "",
    defaultBranch: r.defaultBranch, visibility: r.visibility, topics: [],
    createdAt: "", updatedAt: "",
    ownerLogin: r.owner, ownerRole: r.ownerRole === "collaborator" ? "Mentor" : "Team Lead",
    hasIssues: r.hasIssues,
    collaborators, commits: [], prs: [], branches, releases, issues: [], milestones: [], deliverables: [],
    demoMentee: r.owner,
  };
}

/** Map one team-graph DTO into the UI's RepoTeam (with summary repos). */
export function graphTeamToRepoTeam(t: GraphTeamDto): RepoTeam {
  const mentor = person(t.mentor ?? { name: "—", login: null }, "Mentor", 0);
  const lead = person(t.teamLead ?? { name: "—", login: null }, "TeamLead", 1);
  const members: TeamPerson[] = t.members.map((m, i) => person(m, m.role === "TeamLead" ? "TeamLead" : "Mentee", i + 2));
  return {
    id: t.id,
    name: t.name,
    domainKey: t.domainKey ?? "",
    repoModel: t.repoModel,
    mentor,
    teamLead: lead,
    members: members.length ? members : [lead],
    repos: t.repos.map((r) => summaryRepo(t.domainKey ?? "", t.name, r)),
  };
}
