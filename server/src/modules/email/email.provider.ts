import { promises as dns } from "node:dns";
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
  // Verify the connection at most once per window (mirrors LinkUp's 5-min verify cache) so the
  // FIRST send surfaces the real SMTP error (auth/conn/timeout) instead of failing opaquely, but
  // steady-state sends don't pay a verify round-trip each time.
  private verifiedAt = 0;
  private static readonly VERIFY_TTL_MS = 5 * 60 * 1000;

  private async getTransport() {
    if (this.transport) return this.transport;
    const spec = "nodemailer";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer: any = await import(spec);

    const realHost = env.SMTP_HOST!;
    // nodemailer's `family: 4` option is NOT reliably honored — on Render it still resolved
    // smtp.gmail.com to its AAAA (IPv6) record and got ENETUNREACH (no IPv6 egress). The robust
    // fix: resolve the A (IPv4) record OURSELVES and connect by IP literal, while keeping the real
    // hostname as the TLS servername so the cert still validates (SNI). When SMTP_FAMILY=4 fails
    // to resolve, fall back to the hostname (auto). Set SMTP_FAMILY=0 to skip and let Node choose.
    let connectHost = realHost;
    if (env.SMTP_FAMILY === 4) {
      try {
        const [ipv4] = await dns.resolve4(realHost);
        if (ipv4) connectHost = ipv4;
      } catch (err) {
        logger.warn({ host: realHost, err: (err as Error)?.message }, "[EMAIL] IPv4 resolve failed — using hostname");
      }
    }

    // Transport config mirrors the proven LinkUp setup (pool + rate limits + short timeouts).
    this.transport = (nodemailer.default ?? nodemailer).createTransport({
      host: connectHost, // IPv4 literal on Render; real hostname otherwise
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587/2525 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      // Connected by IP, so SNI + cert hostname must be pinned to the real host explicitly.
      tls: { servername: realHost },
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    logger.info(
      { host: realHost, connectHost, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, family: env.SMTP_FAMILY || "auto" },
      "[EMAIL] SMTP transport created",
    );
    return this.transport;
  }

  /** verify() the connection at most once per TTL — first failure is logged with the real cause. */
  private async verifyIfNeeded(transport: { verify: () => Promise<unknown> }) {
    const now = Date.now();
    if (now - this.verifiedAt < SmtpEmailProvider.VERIFY_TTL_MS) return;
    const started = now;
    try {
      await transport.verify();
      this.verifiedAt = now;
      logger.info({ ms: Date.now() - started }, "[EMAIL] SMTP transport verified");
    } catch (err) {
      // Surface the underlying code (ETIMEDOUT/EAUTH/ECONNREFUSED) — the actionable signal.
      const e = err as { code?: string; command?: string; message?: string };
      logger.error(
        { code: e?.code, command: e?.command, message: e?.message, host: env.SMTP_HOST, port: env.SMTP_PORT, family: env.SMTP_FAMILY || "auto" },
        "[EMAIL] SMTP transport verification failed",
      );
      throw err;
    }
  }

  async send(msg: EmailMessage): Promise<{ id?: string }> {
    const transport = await this.getTransport();
    await this.verifyIfNeeded(transport);
    const started = Date.now();
    try {
      const info = await transport.sendMail({
        from: msg.from ?? env.SMTP_FROM ?? env.SMTP_USER,
        to: msg.to,
        cc: msg.cc,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      });
      logger.info({ to: msg.to, messageId: info?.messageId, ms: Date.now() - started }, "[EMAIL] sent");
      return { id: info?.messageId };
    } catch (err) {
      const e = err as { code?: string; command?: string; message?: string };
      logger.error(
        { to: msg.to, code: e?.code, command: e?.command, message: e?.message, ms: Date.now() - started },
        "[EMAIL] send failed",
      );
      throw err;
    }
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
