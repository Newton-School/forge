import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Low-level Discord OAuth2 (authorization-code flow) for the "Connect with Discord" button.
 * Mirrors github.oauth.ts: the connecting user's token is used once to read their verified
 * identity (id + username), then discarded — never persisted. No SDK, just the documented
 * endpoints. The handle is read from Discord, so a user can't claim someone else's.
 */
const AUTHORIZE = "https://discord.com/oauth2/authorize";
const TOKEN = "https://discord.com/api/oauth2/token";
const VIEWER = "https://discord.com/api/users/@me";

/** Opaque CSRF-bound state round-tripped through Discord (base64url JSON). */
export interface DiscordOAuthState {
  n: string; // nonce — matched against the httpOnly state cookie
}

export function newNonce(): string {
  return randomBytes(16).toString("hex");
}

export function encodeState(s: DiscordOAuthState): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

export function decodeState(raw: string | undefined): DiscordOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString()) as DiscordOAuthState;
    return typeof parsed?.n === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Build the consent URL. `identify` is the minimal scope to read id + username. */
export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    redirect_uri: env.DISCORD_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

/** Exchange the one-time code for a short-lived user token (Discord wants form-encoded). */
export async function exchangeCode(code: string): Promise<string> {
  const res = await fetchWithRetry(
    TOKEN,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID!,
        client_secret: env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.DISCORD_OAUTH_REDIRECT_URI,
      }).toString(),
    },
    { retries: 2 },
  );
  const body = (await res.json().catch(() => null)) as { access_token?: string; error?: string } | null;
  if (!res.ok || !body?.access_token) {
    logger.error({ status: res.status, err: body?.error }, "discord oauth token exchange failed");
    throw Errors.badRequest("Discord authorization failed — please try connecting again");
  }
  return body.access_token;
}

export interface DiscordViewer {
  id: string; // permanent snowflake (as string)
  username: string; // current username; global_name preferred for display when present
}

/** Read the authorizing user's verified identity (permanent id + username). */
export async function fetchViewer(token: string): Promise<DiscordViewer> {
  const res = await fetchWithRetry(VIEWER, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw Errors.badRequest("Could not read your Discord identity");
  const u = (await res.json()) as { id: string; username: string; global_name?: string | null };
  return { id: u.id, username: u.global_name || u.username };
}
