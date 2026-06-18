import { prisma } from "../../lib/db.js";
import type { RepoVisibility, RepoPermission, RepoCollabRole } from "@prisma/client";

/** Persistence for repository-mode data (the connected repo + collaborators/branches/releases). */
export interface RepoUpsertInput {
  teamId: string;
  ownerUserId: string | null; // the owning student (per-student model); null for a shared team repo
  ownerRole: RepoCollabRole;
  owner: string;
  name: string;
  fullName: string;
  visibility: RepoVisibility;
  description: string | null;
  defaultBranch: string;
  hasIssues: boolean;
  topics: string[];
}
export interface CollabRow { login: string; permission: RepoPermission; repoRole: RepoCollabRole; }
export interface BranchRow { name: string; protected: boolean; sha: string; }
export interface ReleaseRow { tag: string; name: string; publishedAt: Date; author: string | null; notes: string | null; }

const REPO_INCLUDE = { collaborators: true, branches: true, releases: { orderBy: { publishedAt: "desc" as const } } };

// Roster + repo summaries for the team-first graph (domain list or a single team).
const TEAM_GRAPH_SELECT = {
  id: true, name: true,
  domain: { select: { key: true, githubRepoModel: true } },
  mentor: { select: { fullName: true, githubUsername: true } },
  members: { select: { memberRole: true, user: { select: { id: true, fullName: true, githubUsername: true } } } },
  repositories: {
    select: {
      name: true, fullName: true, owner: true, ownerUserId: true, ownerRole: true,
      visibility: true, hasIssues: true, description: true, defaultBranch: true,
      _count: { select: { collaborators: true, branches: true, releases: true } },
    },
    orderBy: { name: "asc" as const },
  },
} as const;

export const repoStore = {
  // Keyed by fullName (unique) — a team may own many repos (per-student model).
  upsertRepository: (input: RepoUpsertInput) =>
    prisma.repository.upsert({
      where: { fullName: input.fullName },
      create: { ...input, lastSyncedAt: new Date() },
      update: { ...input, lastSyncedAt: new Date() },
    }),

  replaceCollaborators: async (repositoryId: string, rows: CollabRow[]) => {
    await prisma.repoCollaborator.deleteMany({ where: { repositoryId } });
    if (rows.length) await prisma.repoCollaborator.createMany({ data: rows.map((r) => ({ ...r, repositoryId })) });
  },

  replaceBranches: async (repositoryId: string, rows: BranchRow[]) => {
    await prisma.repoBranch.deleteMany({ where: { repositoryId } });
    if (rows.length) await prisma.repoBranch.createMany({ data: rows.map((r) => ({ ...r, repositoryId })) });
  },

  replaceReleases: async (repositoryId: string, rows: ReleaseRow[]) => {
    await prisma.repoRelease.deleteMany({ where: { repositoryId } });
    if (rows.length) await prisma.repoRelease.createMany({ data: rows.map((r) => ({ ...r, repositoryId })) });
  },

  /** All persisted repos for a team (1 for shared, N for per-student), with sub-resources. */
  reposByTeam: (teamId: string) =>
    prisma.repository.findMany({ where: { teamId }, include: REPO_INCLUDE, orderBy: { name: "asc" } }),

  /** One persisted repo of a team by repo name (the repository-detail view). */
  repoForTeam: (teamId: string, repoName: string) =>
    prisma.repository.findFirst({ where: { teamId, name: repoName }, include: REPO_INCLUDE }),

  /** Team name + domain (key + repo model) for the dashboard's team context. */
  teamContext: (teamId: string) =>
    prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, domain: { select: { key: true, githubRepoModel: true } } },
    }),

  /** Every team in a domain (scope-filtered) with roster + repo summaries — the team-first graph. */
  teamGraphForDomain: (domainKey: string, where: Record<string, unknown>) =>
    prisma.team.findMany({ where: { domain: { key: domainKey }, ...where }, select: TEAM_GRAPH_SELECT, orderBy: { name: "asc" } }),

  /** A single team's roster + repo summaries (the team-detail + repo-detail context). */
  teamGraph: (teamId: string) =>
    prisma.team.findUnique({ where: { id: teamId }, select: TEAM_GRAPH_SELECT }),
};

export type StoredRepository = Awaited<ReturnType<typeof repoStore.repoForTeam>>;
