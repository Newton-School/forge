import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";
import type { NormalizedActivity } from "./github.webhook.js";

/** Extract the "owner/repo" display name from a repo URL (or pass-through if it's
 *  already in owner/repo form). Returns null when it can't be parsed. */
function repoFullName(s: string): string | null {
  const u = s.trim();
  const m = u.match(/github\.com[/:]+([^/\s]+\/[^/\s.]+?)(?:\.git)?\/?$/i);
  if (m) return m[1]!;
  if (/^[^/\s]+\/[^/\s]+$/.test(u)) return u;
  return null;
}

/** Data access for GitHub activity + identity resolution. */
export const githubRepo = {
  /** Resolve a GitHub login to a Forge user id (activity attribution). */
  userIdByLogin: async (login: string | null): Promise<string | null> => {
    if (!login) return null;
    const u = await prisma.user.findFirst({ where: { githubUsername: login }, select: { id: true } });
    return u?.id ?? null;
  },

  /** Resolve a repo full-name ("org/repo") to a team via its stored repo URL. */
  teamIdByRepo: async (repo: string | null): Promise<string | null> => {
    if (!repo) return null;
    const t = await prisma.team.findFirst({
      where: { githubRepoUrl: { contains: repo } },
      select: { id: true },
    });
    return t?.id ?? null;
  },

  /** Idempotent upsert keyed by the unique externalId (webhook redelivery safe). */
  upsertActivity: (a: NormalizedActivity, teamId: string | null, userId: string | null) =>
    prisma.githubActivity.upsert({
      where: { externalId: a.externalId },
      create: {
        externalId: a.externalId, type: a.type, title: a.title, state: a.state,
        url: a.url, occurredAt: a.occurredAt, teamId, userId, repo: a.repo,
        raw: { repo: a.repo, login: a.githubLogin } as Prisma.InputJsonValue,
      },
      update: { state: a.state, title: a.title, occurredAt: a.occurredAt, teamId, userId, repo: a.repo },
    }),

  /** Team ids belonging to any of the given domains (for domain-scoped reads). */
  teamIdsInDomains: async (domainIds: string[]): Promise<string[]> => {
    const teams = await prisma.team.findMany({ where: { domainId: { in: domainIds } }, select: { id: true } });
    return teams.map((t) => t.id);
  },

  /** Resolve a domain id from its key (e.g. "AI") — for the AI org-mode access check. */
  domainIdByKey: async (key: string): Promise<string | null> => {
    const d = await prisma.domain.findFirst({ where: { key }, select: { id: true } });
    return d?.id ?? null;
  },

  /** Does the user belong to ANY team in this domain (as mentor or member)? */
  userInDomain: async (userId: string, domainId: string): Promise<boolean> => {
    const team = await prisma.team.findFirst({
      where: { domainId, OR: [{ mentorId: userId }, { members: { some: { userId } } }] },
      select: { id: true },
    });
    return team !== null;
  },

  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.githubActivity.findMany({ where, orderBy: { occurredAt: "desc" }, take, skip }),

  /** Display names for the bare userId/teamId columns on activity rows. */
  userNames: (ids: string[]) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true, githubUsername: true } }),
  teamNames: (ids: string[]) =>
    prisma.team.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),

  /** Link a Forge user to their verified GitHub identity (Connect with GitHub). */
  setUserGithub: (userId: string, login: string, githubId: number) =>
    prisma.user.update({
      where: { id: userId },
      data: { githubUsername: login, githubUserId: String(githubId), githubConnectedAt: new Date() },
      select: { id: true },
    }),

  /** Team ownership facts used to authorize binding a repo to it. */
  teamForBind: (teamId: string) =>
    prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, mentorId: true, domainId: true },
    }),

  /** Bind a repo URL to a team (matched later by the webhook's repo full-name).
   *  Also stores the "owner/repo" display name for dashboards. */
  /** The user's verified GitHub login (null if they haven't connected). */
  githubLogin: async (userId: string): Promise<string | null> => {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { githubUsername: true } });
    return u?.githubUsername ?? null;
  },

  /** Is this user a member of this team? (gate for binding one's own PER_STUDENT repo) */
  isTeamMember: async (userId: string, teamId: string): Promise<boolean> => {
    const m = await prisma.teamMember.findFirst({ where: { userId, teamId }, select: { id: true } });
    return m !== null;
  },

  /** PER_STUDENT (ML): bind the caller's own repo to their team membership. */
  setMemberRepo: (userId: string, teamId: string, repoUrl: string) =>
    prisma.teamMember.updateMany({
      where: { userId, teamId },
      data: { githubRepoUrl: repoUrl, githubRepoName: repoFullName(repoUrl) },
    }),

  setTeamRepo: (teamId: string, repoUrl: string) =>
    prisma.team.update({
      where: { id: teamId },
      data: { githubRepoUrl: repoUrl, githubRepoName: repoFullName(repoUrl) },
      select: { id: true },
    }),

  /** The repo URL connected to a team (repository-mode dashboards). */
  teamRepoUrl: async (teamId: string): Promise<string | null> => {
    const t = await prisma.team.findUnique({ where: { id: teamId }, select: { githubRepoUrl: true } });
    return t?.githubRepoUrl ?? null;
  },

  /** Facts used to authorize team-scoped reads: domain, mentor, and member ids. */
  teamAccess: (teamId: string) =>
    prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, domainId: true, mentorId: true, members: { select: { userId: true } } },
    }),
};
