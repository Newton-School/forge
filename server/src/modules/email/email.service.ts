import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { emailRepo } from "./email.repository.js";
import { emailProvider } from "./email.provider.js";
import { buildOnboardingEmail } from "./onboarding.js";
import { emitNotification } from "../notifications/notifications.service.js";
import type { AnnouncementInput, BulkSendInput, SendEmailInput, TargetInput, TestOnboardingInput } from "./email.schema.js";

// Caps keep a single request from blasting the whole user base (CLAUDE.md: capped + rate-limited).
const SINGLE_CAP = 200;
const BULK_CAP = 1000;
const ANNOUNCE_CAP = 2000;

interface DeliverArgs {
  subject: string;
  body: string;
  recipients: string[];
  cc?: string[];
  scheduledAt?: Date;
  templateId?: string;
}

/** Persist an Email row and (unless scheduled for later) push it through the provider. */
async function deliver(senderId: string, a: DeliverArgs) {
  if (a.scheduledAt && a.scheduledAt.getTime() > Date.now()) {
    const row = await emailRepo.createEmail({
      senderId, subject: a.subject, body: a.body, recipients: a.recipients, cc: a.cc,
      status: "SCHEDULED", scheduledAt: a.scheduledAt, templateId: a.templateId,
    });
    return { id: row.id, status: "SCHEDULED" as const, recipients: a.recipients.length };
  }
  const row = await emailRepo.createEmail({
    senderId, subject: a.subject, body: a.body, recipients: a.recipients, cc: a.cc,
    status: "DRAFT", templateId: a.templateId,
  });
  try {
    await emailProvider().send({ to: a.recipients, cc: a.cc, subject: a.subject, html: a.body });
    await emailRepo.markStatus(row.id, "SENT", new Date());
    return { id: row.id, status: "SENT" as const, recipients: a.recipients.length };
  } catch (err) {
    logger.error({ err, emailId: row.id }, "email send failed");
    await emailRepo.markStatus(row.id, "FAILED", null);
    throw Errors.badRequest("Email delivery failed");
  }
}

export async function sendEmail(ctx: AuthContext, input: SendEmailInput, ip?: string) {
  const result = await deliver(ctx.id, { subject: input.subject, body: input.body, recipients: input.to, cc: input.cc, templateId: input.templateId });
  await audit(ctx, { action: "email:send", entityType: "Email", entityId: result.id, after: { recipients: result.recipients, status: result.status }, ip });
  return result;
}

export async function bulkSend(ctx: AuthContext, input: BulkSendInput, ip?: string) {
  const recipients = await emailRepo.resolveRecipientEmails(input.target, BULK_CAP);
  if (recipients.length === 0) throw Errors.badRequest("No active recipients match that target");
  if (recipients.length === BULK_CAP) logger.warn({ cap: BULK_CAP }, "bulk send hit the recipient cap — some recipients were not included");
  const result = await deliver(ctx.id, {
    subject: input.subject, body: input.body, recipients, scheduledAt: input.scheduledAt, templateId: input.templateId,
  });
  await audit(ctx, { action: "email:bulkSend", entityType: "Email", entityId: result.id, after: { recipients: result.recipients, status: result.status, target: input.target }, ip });
  return { ...result, capped: recipients.length === BULK_CAP };
}

/** Resolve a recipient target from an announcement's scope when none is given explicitly. */
function targetFromScope(input: AnnouncementInput): TargetInput {
  if (input.target) return input.target;
  if (input.scopeType === "DOMAIN" && input.scopeId) return { domainId: input.scopeId };
  if (input.scopeType === "TEAM" && input.scopeId) return { teamId: input.scopeId };
  return {};
}

/**
 * A non-global caller (Teacher/Mentor hold announcement:send) may only broadcast WITHIN their
 * scope. Reject a GLOBAL/empty target or a domain/team outside their reach — otherwise a Teacher
 * scoped to one domain could email/notify every user in another domain (or everyone).
 */
function assertCanTarget(ctx: AuthContext, target: TargetInput): void {
  const s = effectiveScope(ctx);
  if (s.global) return;
  if (target.teamId) {
    if (!s.teamIds.includes(target.teamId)) throw Errors.forbidden("That team is outside your scope");
  } else if (target.domainId) {
    if (!s.domainIds.includes(target.domainId)) throw Errors.forbidden("That domain is outside your scope");
  } else {
    throw Errors.forbidden("You cannot send a global announcement — target a domain or team in your scope");
  }
}

export async function sendAnnouncement(ctx: AuthContext, input: AnnouncementInput, ip?: string) {
  const target = targetFromScope(input);
  assertCanTarget(ctx, target); // bound the broadcast to the caller's scope before persisting/sending
  const announcement = await emailRepo.createAnnouncement(ctx.id, input);

  let notified = 0;
  if (input.channels.includes("inapp")) {
    const ids = await emailRepo.resolveRecipientIds(target, ANNOUNCE_CAP);
    await Promise.all(ids.map((userId) =>
      emitNotification(userId, "ANNOUNCEMENT", { announcementId: announcement.id, title: input.title, body: input.body })));
    notified = ids.length;
  }

  let emailResult: { recipients: number; status: string } | null = null;
  if (input.channels.includes("email")) {
    const recipients = await emailRepo.resolveRecipientEmails(target, ANNOUNCE_CAP);
    if (recipients.length > 0) {
      emailResult = await deliver(ctx.id, { subject: input.title, body: input.body, recipients });
    }
  }

  await audit(ctx, { action: "announcement:send", entityType: "Announcement", entityId: announcement.id, after: { channels: input.channels, notified }, ip });
  return { id: announcement.id, notified, email: emailResult };
}

export async function listTemplates(_ctx: AuthContext) {
  const rows = await emailRepo.listTemplates();
  const items = rows.map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    // "Owned by" the responsible role (no per-edit author tracking yet).
    updatedBy: t.ownerRole ? t.ownerRole.charAt(0) + t.ownerRole.slice(1).toLowerCase() : "—",
    updatedAt: t.updatedAt,
  }));
  return { items };
}

/** "test.mentee2024" → "Test Mentee" — a friendly name for previews. */
function nameFromEmail(email: string): string {
  return (
    email.split("@")[0]!
      .replace(/[0-9]+/g, " ")
      .split(/[._]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
      .trim() || "there"
  );
}

/**
 * Send the [TEST] onboarding email to reviewers. Identical to the production email
 * except the TEST banner + `[TEST]` subject, and no tracking pixel. Sent individually
 * (no recipient sees the others). Best-effort per recipient; reports the results.
 */
export async function sendTestOnboarding(ctx: AuthContext, input: TestOnboardingInput, ip?: string) {
  const provider = emailProvider();
  const results: { to: string; ok: boolean; error?: string }[] = [];
  for (const to of input.recipients) {
    const mail = buildOnboardingEmail({
      fullName: nameFromEmail(to), role: "Mentee", domain: "AI", team: "AI · Team Alpha",
      portalUrl: env.APP_BASE_URL, test: true,
    });
    try {
      await provider.send({ to: [to], subject: mail.subject, html: mail.html, text: mail.text, from: mail.from });
      results.push({ to, ok: true });
    } catch (err) {
      results.push({ to, ok: false, error: err instanceof Error ? err.message : "send failed" });
    }
  }
  const sent = results.filter((r) => r.ok).length;
  await audit(ctx, { action: "email:testOnboarding", entityType: "Email", after: { recipients: input.recipients.length, sent }, ip });
  return { sent, failed: results.length - sent, results };
}

/** Public open-tracking pixel — marks the invitation OPENED, then returns a 1×1 transparent PNG. */
export async function trackOpen(token: string): Promise<Buffer> {
  const { markOpenedByToken } = await import("../invitations/invitations.service.js");
  await markOpenedByToken(token).catch(() => undefined);
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
}
