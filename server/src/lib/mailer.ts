import { promises as dns } from "node:dns";
import nodemailer, { type Transporter } from "nodemailer";
import { env, mailerConfigured } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * SMTP transport (nodemailer). A single lazily-created transporter for the
 * process — like the Prisma/logger singletons. When SMTP isn't configured,
 * sending is skipped (logged) rather than throwing, so a missing mailer never
 * breaks core flows (reliability: degrade gracefully).
 */
let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;
  const realHost = env.SMTP_HOST!;
  // Same IPv4 workaround as the email module's provider: nodemailer's `family` option isn't
  // reliably honored, so on PaaS hosts with no IPv6 egress (Render) it picks the AAAA record and
  // gets ENETUNREACH. Resolve the A record ourselves and connect by IP, pinning tls.servername to
  // the real host so the cert validates. SMTP_FAMILY=0 disables this and lets Node choose.
  let connectHost = realHost;
  if (env.SMTP_FAMILY === 4) {
    try {
      const [ipv4] = await dns.resolve4(realHost);
      if (ipv4) connectHost = ipv4;
    } catch (err) {
      logger.warn({ host: realHost, err: (err as Error)?.message }, "SMTP IPv4 resolve failed — using hostname");
    }
  }
  transporter = nodemailer.createTransport({
    host: connectHost,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587/2525 = STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { servername: realHost },
  });
  return transporter;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export type SendEmailResult =
  | { skipped: true }
  | { skipped: false; messageId: string };

/** Send one email. No-op (logged) when SMTP is unconfigured. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!mailerConfigured) {
    logger.warn(
      { to: input.to, subject: input.subject },
      "SMTP not configured — email skipped",
    );
    return { skipped: true };
  }
  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    ...input,
  });
  logger.info({ messageId: info.messageId, to: input.to }, "email sent");
  return { skipped: false, messageId: info.messageId };
}

/** Verify SMTP connectivity (call at boot; non-fatal). */
export async function verifyMailer(): Promise<boolean> {
  if (!mailerConfigured) return false;
  try {
    const transport = await getTransporter();
    await transport.verify();
    logger.info("SMTP transport verified");
    return true;
  } catch (err) {
    logger.error({ err }, "SMTP verification failed");
    return false;
  }
}
