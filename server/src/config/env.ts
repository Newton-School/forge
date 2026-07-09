import { readFileSync } from "node:fs";
import { z } from "zod";

/** Zod-validated environment — fail fast on misconfiguration (no silent undefineds). */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  // Local dev HTTPS. When both files exist, the server serves TLS (so OAuth redirect URIs
  // are https). Optional; unset/absent → plain http (prod terminates TLS at the ALB).
  // Defaults to certs/localhost*.pem when unset — see server/README.md (mkcert).
  HTTPS_KEY_FILE: z.string().optional(),
  HTTPS_CERT_FILE: z.string().optional(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  // Cookie scope. When client + API are on different subdomains (e.g. forge.taj.works +
  // forge.server.taj.works), set this to the shared parent (".taj.works") so the session and
  // CSRF cookies are readable on BOTH — required for the client's SSR session check and CSRF
  // echo. Leave unset for a single-host/localhost setup (host-only cookies).
  COOKIE_DOMAIN: z.string().optional(),
  // Hard cap on a session's lifetime regardless of activity (idle window is the cookie
  // maxAge). Forces re-auth after this many hours even for a continuously-active user.
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().min(1).max(720).default(24),

  ALLOWED_HOSTED_DOMAIN: z.string().default("rishihood.edu.in"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:8000/api/auth/google/callback"),

  // Newton School authentication SDK (backend-only). When configured, powers the
  // /newton/login + /newton/callback flow — the login method (replaces Google).
  // Identity + platform access come from Newton; Forge's invite-only allowlist +
  // RBAC still decide who gets in. CLIENT_SECRET/CALLBACK_SECRET are secrets.
  NEWTON_AUTH_CLIENT_ID: z.string().optional(),
  NEWTON_AUTH_CLIENT_SECRET: z.string().optional(),
  NEWTON_AUTH_CALLBACK_SECRET: z.string().optional(),
  NEWTON_AUTH_BASE_URL: z.string().url().default("https://staging-newtonschool.co/api/v1"),

  // Secret that gates internal job endpoints (e.g. recomputing public landing
  // stats) so a scheduled cron can trigger them without a user session. Optional:
  // when unset, those job endpoints are disabled (return 403).
  JOBS_SECRET: z.string().optional(),

  // Email (SMTP) — nodemailer transport. Optional: when unset, email is skipped.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // e.g. "Forge <no-reply@…>"; falls back to SMTP_USER
  // IP family for the SMTP socket. Default 4 (force IPv4) — avoids the broken-IPv6-egress
  // ETIMEDOUT seen on Render/Fly. Set to 6 or 0 (auto) only if your host needs it.
  SMTP_FAMILY: z.coerce.number().int().refine((n) => n === 0 || n === 4 || n === 6, "SMTP_FAMILY must be 0, 4 or 6").default(4),

  // Comma-separated CC list for concern notifications (the organizing team).
  // The "to" is always the LCC; this just adds the org team on CC.
  CONCERN_CC_EMAILS: z.string().optional(),

  // GitHub integration — webhook HMAC secret + read token + the AI-domain org slug.
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_API_TOKEN: z.string().optional(),
  GITHUB_ORG: z.string().default("newton-school-ai"),

  // GitHub OAuth App (owned by the lcc-ai-nst account) — powers "Connect with GitHub":
  // verifies each user's username and lets a mentor's one click auto-create the repo
  // webhook. Optional: when unset, the Connect flow is unavailable (no crash).
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITHUB_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:8000/api/integrations/github/oauth/callback"),

  // Repository-mode reads (ML/DVA/SDSE public repos). The machine account added as a
  // read collaborator on connect; its optional classic PAT (public_repo) raises the read
  // rate limit and lets the server list collaborators. Reads work unauthenticated too.
  GITHUB_READER_LOGIN: z.string().default("lcc-ai-nst"),
  GITHUB_READER_TOKEN: z.string().optional(),

  // Discord integration — interactions public key (Ed25519) + optional bot token.
  DISCORD_PUBLIC_KEY: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  // Discord OAuth2 app (same application) — powers per-user "Connect with Discord": verifies the
  // user's real Discord handle + permanent id. Optional: when unset, the Connect flow is unavailable.
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:8000/api/integrations/discord/oauth/callback"),

  // Google Calendar (service account) — reads the shared LCC calendar + pushes events. The SA can
  // be supplied three ways (first that resolves wins): split fields, an inline JSON blob, or a path
  // to the downloaded JSON key file.
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_SA_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_SA_PRIVATE_KEY: z.string().optional(), // PEM; literal "\n" sequences are normalized
  GOOGLE_SA_KEY: z.string().optional(), // inline service-account JSON
  GOOGLE_SA_KEY_FILE: z.string().optional(), // path to the service-account JSON key file

  // Groq (AI) — optional API key for the assistant adapter.
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // Scheduled jobs — auto-flags / escalations runner.
  JOBS_ENABLED: z.coerce.boolean().default(false),
  JOBS_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(1440).default(60),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    if (process.env.NODE_ENV === "test") throw new Error(`Invalid env:\n${issues}`);
    // eslint-disable-next-line no-console
    console.error(`\n✖ Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}

export const env = loadEnv();

/** Google login is only wired when both client id + secret are present. */
export const googleConfigured = Boolean(
  env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET,
);
/** Newton login is wired when the client id + secret + callback secret are present. */
export const newtonConfigured = Boolean(
  env.NEWTON_AUTH_CLIENT_ID && env.NEWTON_AUTH_CLIENT_SECRET && env.NEWTON_AUTH_CALLBACK_SECRET,
);
/** SMTP is only wired when host + user + pass are present; else email is skipped. */
export const mailerConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS,
);
/** GitHub webhooks are only verified when a signing secret is configured. */
export const githubWebhookConfigured = Boolean(env.GITHUB_WEBHOOK_SECRET);
/** The "Connect with GitHub" OAuth flow is wired only when the app id + secret exist. */
export const githubOAuthConfigured = Boolean(
  env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET,
);
/** Discord interactions are only verified when the app public key is configured. */
export const discordConfigured = Boolean(env.DISCORD_PUBLIC_KEY);
/** The "Connect with Discord" OAuth flow is wired only when the app id + secret exist. */
export const discordOAuthConfigured = Boolean(
  env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET,
);
/**
 * Resolve the Google service-account credentials from (in order): explicit split env fields, an
 * inline JSON blob (GOOGLE_SA_KEY), or a JSON key file (GOOGLE_SA_KEY_FILE). Returns null when none
 * resolve. Cached; reads the file once at boot.
 */
let saCache: { client_email: string; private_key: string } | null | undefined;
export function googleServiceAccount(): { client_email: string; private_key: string } | null {
  if (saCache !== undefined) return saCache;
  if (env.GOOGLE_SA_CLIENT_EMAIL && env.GOOGLE_SA_PRIVATE_KEY) {
    saCache = { client_email: env.GOOGLE_SA_CLIENT_EMAIL, private_key: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n") };
    return saCache;
  }
  let raw = env.GOOGLE_SA_KEY;
  if (!raw && env.GOOGLE_SA_KEY_FILE) {
    try {
      raw = readFileSync(env.GOOGLE_SA_KEY_FILE, "utf8");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[env] GOOGLE_SA_KEY_FILE could not be read (${env.GOOGLE_SA_KEY_FILE}): ${(err as Error).message}`);
    }
  }
  if (raw) {
    try {
      const j = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) { saCache = { client_email: j.client_email, private_key: j.private_key }; return saCache; }
    } catch {
      // eslint-disable-next-line no-console
      console.warn("[env] GOOGLE_SA_KEY / key file is not valid JSON");
    }
  }
  saCache = null;
  return saCache;
}
/** Google Calendar is wired when a calendar id + a resolvable service account both exist. */
export const googleCalendarConfigured = Boolean(env.GOOGLE_CALENDAR_ID) && googleServiceAccount() !== null;
/** Groq is wired only when an API key is present. */
export const groqConfigured = Boolean(env.GROQ_API_KEY);
export const isProd = env.NODE_ENV === "production";
