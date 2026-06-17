import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Low-level GitHub OAuth (authorization-code flow) for the "Connect with GitHub"
 * button. The OAuth App is owned by the lcc-ai-nst account; tokens returned here are
 * the *connecting user's* and are used once (read identity / create a webhook), then
 * discarded — never persisted. No SDK, just the three documented endpoints.
 */
const AUTHORIZE = "https://github.com/login/oauth/authorize";
const TOKEN = "https://github.com/login/oauth/access_token";
const VIEWER = "https://api.github.com/user";

/** Opaque CSRF-bound state we round-trip through GitHub (base64url JSON). */
export interface OAuthState {
  n: string; // nonce — matched against the httpOnly state cookie
  repo?: string; // optional repo to wire (owner/repo or URL)
  teamId?: string; // team the repo binds to
}

export function newNonce(): string {
  return randomBytes(16).toString("hex");
}

export function encodeState(s: OAuthState): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

export function decodeState(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString()) as OAuthState;
    return typeof parsed?.n === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Build the consent URL. Scopes widen only when a repo will be connected (least privilege). */
export function authorizeUrl(state: string, withRepo: boolean): string {
  const scope = withRepo ? "read:user admin:repo_hook public_repo" : "read:user";
  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_CLIENT_ID!,
    redirect_uri: env.GITHUB_OAUTH_REDIRECT_URI,
    scope,
    state,
    allow_signup: "false",
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

/** Exchange the one-time authorization code for a short-lived user access token. */
export async function exchangeCode(code: string): Promise<string> {
  const res = await fetchWithRetry(
    TOKEN,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "forge-server",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_OAUTH_REDIRECT_URI,
      }),
    },
    // Retry only transient failures; a consumed/invalid code 400s and won't be retried.
    { retries: 2 },
  );
  const body = (await res.json().catch(() => null)) as
    | { access_token?: string; error?: string; error_description?: string }
    | null;
  if (!res.ok || !body?.access_token) {
    logger.error({ status: res.status, err: body?.error }, "github oauth token exchange failed");
    throw Errors.badRequest("GitHub authorization failed — please try connecting again");
  }
  return body.access_token;
}

export interface GithubViewer {
  login: string;
  id: number;
}

/** Read the authorizing user's *verified* identity (login + permanent numeric id). */
export async function fetchViewer(token: string): Promise<GithubViewer> {
  const res = await fetchWithRetry(VIEWER, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "forge-server",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw Errors.badRequest("Could not read your GitHub identity");
  const u = (await res.json()) as { login: string; id: number };
  return { login: u.login, id: u.id };
}
