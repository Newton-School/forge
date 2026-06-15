import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";

/** Data access for Discord activity + identity resolution. */
export const discordRepo = {
  userIdByDiscordId: async (discordUserId: string | null): Promise<string | null> => {
    if (!discordUserId) return null;
    const u = await prisma.user.findFirst({ where: { discordUserId }, select: { id: true } });
    return u?.id ?? null;
  },

  teamIdByChannel: async (channelId: string | null): Promise<string | null> => {
    if (!channelId) return null;
    const t = await prisma.team.findFirst({ where: { discordChannelId: channelId }, select: { id: true } });
    return t?.id ?? null;
  },

  teamIdsInDomains: async (domainIds: string[]): Promise<string[]> => {
    const teams = await prisma.team.findMany({ where: { domainId: { in: domainIds } }, select: { id: true } });
    return teams.map((t) => t.id);
  },

  createActivity: (data: { teamId: string | null; userId: string | null; channelId: string | null; occurredAt: Date; raw: Prisma.InputJsonValue }) =>
    prisma.discordActivity.create({
      data: { type: "MESSAGE", teamId: data.teamId, userId: data.userId, channelId: data.channelId, occurredAt: data.occurredAt, raw: data.raw },
    }),

  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.discordActivity.findMany({ where, orderBy: { occurredAt: "desc" }, take, skip }),
};
