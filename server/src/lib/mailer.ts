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

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
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
  const info = await getTransporter().sendMail({
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
    await getTransporter().verify();
    logger.info("SMTP transport verified");
    return true;
  } catch (err) {
    logger.error({ err }, "SMTP verification failed");
    return false;
  }
}
