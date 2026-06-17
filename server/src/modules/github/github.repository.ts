import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";
import type { NormalizedActivity } from "./github.webhook.js";

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
        url: a.url, occurredAt: a.occurredAt, teamId, userId, raw: { repo: a.repo, login: a.githubLogin } as Prisma.InputJsonValue,
      },
      update: { state: a.state, title: a.title, occurredAt: a.occurredAt, teamId, userId },
    }),

  /** Team ids belonging to any of the given domains (for domain-scoped reads). */
  teamIdsInDomains: async (domainIds: string[]): Promise<string[]> => {
    const teams = await prisma.team.findMany({ where: { domainId: { in: domainIds } }, select: { id: true } });
    return teams.map((t) => t.id);
  },

  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.githubActivity.findMany({ where, orderBy: { occurredAt: "desc" }, take, skip }),

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

  /** Bind a repo URL to a team (matched later by the webhook's repo full-name). */
  setTeamRepo: (teamId: string, repoUrl: string) =>
    prisma.team.update({ where: { id: teamId }, data: { githubRepoUrl: repoUrl }, select: { id: true } }),
};
