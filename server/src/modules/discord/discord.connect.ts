import type { AuthContext } from "../../rbac/types.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { Errors } from "../../lib/errors.js";
import { discordRepo } from "./discord.repository.js";
import {
  authorizeUrl, decodeState, encodeState, exchangeCode, fetchViewer, newNonce,
} from "./discord.oauth.js";

/** httpOnly cookie holding the state nonce — the CSRF binding across the redirect. */
export const STATE_COOKIE = "forge_dc_oauth";

export interface StartResult {
  url: string;
  nonce: string;
}

/** Build the consent redirect + the nonce the route stores in the state cookie. */
export function buildStart(): StartResult {
  const nonce = newNonce();
  return { url: authorizeUrl(encodeState({ n: nonce })), nonce };
}

export type CallbackStatus = "connected" | "denied";
export interface CallbackResult {
  status: CallbackStatus;
  username?: string;
}

/**
 * Verify the round-trip (state nonce matches the cookie), exchange the code, read the user's
 * VERIFIED Discord identity, and persist it. The token is used once then discarded. The handle
 * comes from Discord — a user can't claim someone else's.
 */
export async function handleCallback(
  ctx: AuthContext,
  code: string | undefined,
  state: string | undefined,
  cookieNonce: string | undefined,
  ip?: string,
): Promise<CallbackResult> {
  const decoded = decodeState(state);
  if (!code || !decoded || !cookieNonce || decoded.n !== cookieNonce) {
    logger.warn({ userId: ctx.id }, "discord oauth state mismatch");
    return { status: "denied" };
  }

  const token = await exchangeCode(code);
  const viewer = await fetchViewer(token);

  // The permanent snowflake is @unique — release it from any other account first.
  await discordRepo.clearDiscordIdentityElsewhere(viewer.id, ctx.id);
  await discordRepo.setDiscordIdentity(ctx.id, viewer.username, viewer.id);
  await audit(ctx, {
    action: "discord:connect", entityType: "User", entityId: ctx.id,
    after: { discordUsername: viewer.username }, ip,
  });
  return { status: "connected", username: viewer.username };
}

/** Surfaces a clear error when the OAuth app isn't configured (route guards this too). */
export function assertConfigured(configured: boolean): void {
  if (!configured) throw Errors.badRequest("Discord Connect is not configured");
}
