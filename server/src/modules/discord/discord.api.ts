import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Read-through Discord bot API client. Authenticates with the bot token to confirm
 * connectivity and (optionally) read guild/channel metadata. Like the GitHub client:
 * timed-out, error-mapped, and a no-op `ping` when unconfigured.
 */
const BASE = "https://discord.com/api/v10";

export const discordBotConfigured = () => Boolean(env.DISCORD_BOT_TOKEN);

function headers() {
  return { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "User-Agent": "forge-server (https://forge, 1.0)" };
}

async function dapi<T>(path: string): Promise<T> {
  if (!discordBotConfigured()) throw Errors.badRequest("Discord bot token is not configured");
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE}${path}`, { headers: headers() });
  } catch (err) {
    logger.error({ err, path }, "discord api request failed (network/timeout)");
    throw Errors.badRequest("Discord request failed");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    logger.error({ status: res.status, path, msg: body?.message }, "discord api error");
    if (res.status === 401) throw Errors.forbidden("Discord bot token is invalid");
    if (res.status === 404) throw Errors.notFound("Discord resource not found");
    throw Errors.badRequest("Discord request failed");
  }
  return (await res.json()) as T;
}

interface DiscordBotUser { id: string; username: string; bot?: boolean; }
interface DiscordGuild { id: string; name: string; }
interface DiscordChannel { id: string; name: string; type: number; }

export const discordApi = {
  listGuilds: () => dapi<DiscordGuild[]>("/users/@me/guilds"),
  listGuildChannels: (guildId: string) => dapi<DiscordChannel[]>(`/guilds/${guildId}/channels`),

  /** Connectivity probe for the integration status endpoint. */
  ping: async (): Promise<{ ok: boolean; bot?: string; guilds?: number; message?: string }> => {
    if (!discordBotConfigured()) return { ok: false, message: "bot token not configured" };
    try {
      const me = await dapi<DiscordBotUser>("/users/@me");
      const guilds = await discordApi.listGuilds().catch(() => []);
      return { ok: true, bot: me.username, guilds: guilds.length };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "unreachable" };
    }
  },
};
