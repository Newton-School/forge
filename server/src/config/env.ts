import { z } from "zod";

/** Zod-validated environment — fail fast on misconfiguration (no silent undefineds). */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  // Hard cap on a session's lifetime regardless of activity (idle window is the cookie
  // maxAge). Forces re-auth after this many hours even for a continuously-active user.
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().min(1).max(720).default(24),

  ALLOWED_HOSTED_DOMAIN: z.string().default("rishihood.edu.in"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),

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
    .default("http://localhost:4000/api/integrations/github/oauth/callback"),

  // Repository-mode reads (ML/DVA/SDSE public repos). The machine account added as a
  // read collaborator on connect; its optional classic PAT (public_repo) raises the read
  // rate limit and lets the server list collaborators. Reads work unauthenticated too.
  GITHUB_READER_LOGIN: z.string().default("lcc-ai-nst"),
  GITHUB_READER_TOKEN: z.string().optional(),

  // Discord integration — interactions public key (Ed25519) + optional bot token.
  DISCORD_PUBLIC_KEY: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),

  // Google Calendar (service account) — outbound event push. Optional: when unset,
  // events are stored locally only (no external sync).
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_SA_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_SA_PRIVATE_KEY: z.string().optional(), // PEM; literal "\n" sequences are normalized

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
/** Google Calendar push is wired only when the service-account + calendar id exist. */
export const googleCalendarConfigured = Boolean(
  env.GOOGLE_CALENDAR_ID && env.GOOGLE_SA_CLIENT_EMAIL && env.GOOGLE_SA_PRIVATE_KEY,
);
/** Groq is wired only when an API key is present. */
export const groqConfigured = Boolean(env.GROQ_API_KEY);
export const isProd = env.NODE_ENV === "production";
