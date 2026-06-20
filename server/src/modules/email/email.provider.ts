import { env, mailerConfigured } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/** A single outbound message. `html` is the rendered body. */
export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  cc?: string[];
  text?: string; // plain-text alternative (multipart/alternative)
  from?: string; // override the default From (e.g. the LCC onboarding sender)
}

/**
 * Outbound email port (Adapter pattern). Swap implementations without touching
 * callers — the service depends only on this interface.
 */
export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<{ id?: string }>;
}

/** Safe default: logs the message instead of sending. Used when SMTP is unconfigured. */
class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  async send(msg: EmailMessage): Promise<{ id?: string }> {
    logger.info({ to: msg.to, cc: msg.cc, subject: msg.subject }, "email (console adapter — not actually sent)");
    return {};
  }
}

/**
 * SMTP transport via nodemailer. Loaded lazily by a non-literal specifier so the
 * package is only required at runtime when SMTP is actually configured — the build
 * never depends on it. On any failure the error propagates so the service marks the
 * Email row FAILED.
 */
class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transport: any;

  private async getTransport() {
    if (this.transport) return this.transport;
    const spec = "nodemailer";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer: any = await import(spec);
    // Transport config mirrors the proven LinkUp setup (pool + rate limits + short timeouts),
    // plus an IPv4 default for PaaS hosts (Render/Fly) whose IPv6 egress is broken — that's the
    // usual cause of "works locally, ETIMEDOUT at CONN in prod". Set SMTP_FAMILY=0 to disable.
    this.transport = (nodemailer.default ?? nodemailer).createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587/2525 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      family: env.SMTP_FAMILY || undefined, // 4 = force IPv4; 0 → omit (auto)
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    return this.transport;
  }

  async send(msg: EmailMessage): Promise<{ id?: string }> {
    const transport = await this.getTransport();
    const info = await transport.sendMail({
      from: msg.from ?? env.SMTP_FROM ?? env.SMTP_USER,
      to: msg.to,
      cc: msg.cc,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return { id: info?.messageId };
  }
}

let cached: EmailProvider | null = null;

/** Resolve the configured provider once (SMTP when credentials exist, else console). */
export function emailProvider(): EmailProvider {
  if (!cached) {
    cached = mailerConfigured ? new SmtpEmailProvider() : new ConsoleEmailProvider();
    logger.info({ provider: cached.name }, "email provider selected");
  }
  return cached;
}
