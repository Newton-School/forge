import { prisma } from "../../lib/db.js";
import type { RepoVisibility, RepoPermission, RepoCollabRole } from "@prisma/client";

/** Persistence for repository-mode data (the connected repo + collaborators/branches/releases). */
export interface RepoUpsertInput {
  teamId: string;
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

export const repoStore = {
  upsertRepository: (input: RepoUpsertInput) =>
    prisma.repository.upsert({
      where: { teamId: input.teamId },
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

  /** The persisted repo for a team, with collaborators/branches/releases. */
  byTeam: (teamId: string) =>
    prisma.repository.findUnique({
      where: { teamId },
      include: { collaborators: true, branches: true, releases: { orderBy: { publishedAt: "desc" } } },
    }),

  /** Team name + domain key for the dashboard's team context. */
  teamContext: (teamId: string) =>
    prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, domain: { select: { key: true } } } }),
};

export type StoredRepository = Awaited<ReturnType<typeof repoStore.byTeam>>;
