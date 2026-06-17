import { logger } from "../../lib/logger.js";
import type { RepoPermission, RepoCollabRole, RepoVisibility } from "@prisma/client";
import { repoApi, listCollaboratorsWithToken } from "./repo.api.js";
import { toOverview, toCollaborator, toBranch, toRelease } from "./repo.read.js";
import { repoStore } from "./repo.store.js";

/** Pure DTO-string → Prisma-enum mappers (unit-testable). */
export const toPermissionEnum = (p: "admin" | "write" | "read"): RepoPermission =>
  p === "admin" ? "ADMIN" : p === "write" ? "WRITE" : "READ";
export const toRoleEnum = (r: "owner" | "maintainer" | "collaborator"): RepoCollabRole =>
  r === "owner" ? "OWNER" : r === "maintainer" ? "MAINTAINER" : "COLLABORATOR";
export const toVisibilityEnum = (v: "public" | "private"): RepoVisibility => (v === "private" ? "PRIVATE" : "PUBLIC");

export interface SyncResult {
  repositoryId: string;
  fullName: string;
  collaborators: number;
  branches: number;
  releases: number;
}

/**
 * Sync a connected public repo from GitHub into the DB. `ownerToken` (the connecting
 * user's token, admin on the repo) is needed to list collaborators — pass it at connect.
 * Without it, repo meta + branches + releases still sync (public API) and existing
 * collaborators are left intact.
 */
export async function syncRepository(
  teamId: string,
  owner: string,
  repo: string,
  ownerToken?: string,
): Promise<SyncResult> {
  const ov = toOverview(await repoApi.getRepo(owner, repo), owner, repo);
  const repository = await repoStore.upsertRepository({
    teamId,
    owner,
    name: ov.repo,
    fullName: ov.fullName,
    visibility: toVisibilityEnum(ov.visibility),
    description: ov.description,
    defaultBranch: ov.defaultBranch,
    hasIssues: ov.hasIssues,
    topics: ov.topics,
  });

  // Collaborators: only with the owner's token (write access required to list them).
  let collaborators = 0;
  if (ownerToken) {
    try {
      const cols = (await listCollaboratorsWithToken(ownerToken, owner, repo)).map((c) => toCollaborator(c, owner));
      await repoStore.replaceCollaborators(
        repository.id,
        cols.map((c) => ({ login: c.login, permission: toPermissionEnum(c.permission), repoRole: toRoleEnum(c.repoRole) })),
      );
      collaborators = cols.length;
    } catch (err) {
      logger.warn({ err, owner, repo }, "collaborator sync skipped (need owner token / write access)");
    }
  }

  const [branches, releases] = await Promise.all([
    repoApi.listBranches(owner, repo).then((b) => b.map(toBranch)).catch(() => []),
    repoApi.listReleases(owner, repo).then((r) => r.map(toRelease)).catch(() => []),
  ]);
  await repoStore.replaceBranches(repository.id, branches.map((b) => ({ name: b.name, protected: b.protected, sha: b.sha })));
  await repoStore.replaceReleases(
    repository.id,
    releases.map((r) => ({ tag: r.tag, name: r.name, publishedAt: new Date(r.publishedAt), author: r.author, notes: r.notes })),
  );

  logger.info({ owner, repo, collaborators, branches: branches.length, releases: releases.length }, "repository synced");
  return { repositoryId: repository.id, fullName: ov.fullName, collaborators, branches: branches.length, releases: releases.length };
}
