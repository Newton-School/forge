import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import type { AuthContext } from "../../rbac/types.js";
import { emailRepo } from "./email.repository.js";
import { emailProvider } from "./email.provider.js";
import { emitNotification } from "../notifications/notifications.service.js";
import type { AnnouncementInput, BulkSendInput, SendEmailInput, TargetInput } from "./email.schema.js";

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

export async function sendAnnouncement(ctx: AuthContext, input: AnnouncementInput, ip?: string) {
  const announcement = await emailRepo.createAnnouncement(ctx.id, input);
  const target = targetFromScope(input);

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
  return { items: await emailRepo.listTemplates() };
}
