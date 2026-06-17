import { env, discordConfigured } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { discordRepo } from "./discord.repository.js";
import { discordApi, discordBotConfigured } from "./discord.api.js";
import {
  normalizeInteraction, verifyDiscordSignature, RESPONSE_PONG, RESPONSE_MESSAGE,
} from "./discord.webhook.js";

export interface InteractionResponse {
  type: number;
  data?: { content: string };
}

/**
 * Verify and handle a Discord interaction. Throws `forbidden` on a bad signature so
 * the route returns 401 and Discord rejects the endpoint. PING → PONG; other
 * interactions are recorded as activity and acknowledged with an ephemeral-style reply.
 */
export async function handleInteraction(
  publicKeyHeaderSig: string | undefined,
  timestamp: string | undefined,
  rawBody: Buffer | undefined,
  parsedBody: unknown,
  now: Date,
): Promise<InteractionResponse> {
  if (!discordConfigured) throw Errors.badRequest("Discord is not configured");
  if (!rawBody) throw Errors.badRequest("Missing request body");
  if (!verifyDiscordSignature(env.DISCORD_PUBLIC_KEY!, timestamp, rawBody, publicKeyHeaderSig)) {
    throw Errors.forbidden("Invalid request signature");
  }

  const n = normalizeInteraction(parsedBody);
  if (n.isPing) return { type: RESPONSE_PONG };

  const [teamId, userId] = await Promise.all([
    discordRepo.teamIdByChannel(n.channelId),
    discordRepo.userIdByDiscordId(n.discordUserId),
  ]);
  await discordRepo.createActivity({
    teamId, userId, channelId: n.channelId, occurredAt: now,
    raw: { command: n.commandName, discordUserId: n.discordUserId },
  });
  logger.info({ command: n.commandName, channelId: n.channelId }, "discord interaction recorded");
  return { type: RESPONSE_MESSAGE, data: { content: "Logged in Forge ✓" } };
}

async function activityScope(ctx: AuthContext): Promise<Record<string, unknown>> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const teamIds = new Set(s.teamIds);
  if (s.domainIds.length) for (const id of await discordRepo.teamIdsInDomains(s.domainIds)) teamIds.add(id);
  const or: Record<string, unknown>[] = [];
  if (teamIds.size) or.push({ teamId: { in: [...teamIds] } });
  if (s.self) or.push({ userId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function listActivity(ctx: AuthContext, q: { teamId?: string; take: number; skip: number }) {
  const where = { ...(await activityScope(ctx)), ...(q.teamId ? { teamId: q.teamId } : {}) };
  return { items: await discordRepo.list(where, q.take, q.skip) };
}

export function status() {
  return { provider: "DISCORD", interactionsConfigured: discordConfigured, botConfigured: discordBotConfigured() };
}

/** Live connectivity probe — confirms the bot token reaches Discord. */
export function check() {
  return discordApi.ping();
}
