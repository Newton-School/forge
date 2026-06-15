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

  ALLOWED_HOSTED_DOMAIN: z.string().default("rishihood.edu.in"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),

  // Email (SMTP) — nodemailer transport. Optional: when unset, email is skipped.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // e.g. "Forge <no-reply@…>"; falls back to SMTP_USER

  // GitHub integration — webhook HMAC secret + optional API token for outbound reads.
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_API_TOKEN: z.string().optional(),

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
/** Discord interactions are only verified when the app public key is configured. */
export const discordConfigured = Boolean(env.DISCORD_PUBLIC_KEY);
/** Google Calendar push is wired only when the service-account + calendar id exist. */
export const googleCalendarConfigured = Boolean(
  env.GOOGLE_CALENDAR_ID && env.GOOGLE_SA_CLIENT_EMAIL && env.GOOGLE_SA_PRIVATE_KEY,
);
/** Groq is wired only when an API key is present. */
export const groqConfigured = Boolean(env.GROQ_API_KEY);
export const isProd = env.NODE_ENV === "production";
