import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { audit } from "../../lib/audit.js";
import type { AuthContext } from "../../rbac/types.js";
import { emailProvider } from "../email/email.provider.js";
import { buildOnboardingEmail } from "../email/onboarding.js";
import { invitationsRepo } from "./invitations.repository.js";

const TTL_DAYS = 14;

const newToken = () => randomBytes(32).toString("base64url");
const expiry = () => new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

export interface InviteLabels {
  role: string;
  domain: string;
  team: string;
}
interface Recipient {
  id: string;
  email: string;
  fullName: string;
}

/** Open-tracking pixel URL — hits the server via the public /api path (ALB-routed in prod). */
function trackUrl(token: string): string {
  return `${env.APP_BASE_URL.replace(/\/$/, "")}/api/email/track/${token}.png`;
}

/** Render + send the onboarding email for an invitation; mark SENT on success.
 *  Best-effort: a failed send leaves the invite PENDING (resendable), never throws. */
async function dispatch(invitationId: string, token: string, to: Recipient, labels: InviteLabels): Promise<boolean> {
  const mail = buildOnboardingEmail({
    fullName: to.fullName,
    role: labels.role,
    domain: labels.domain,
    team: labels.team,
    portalUrl: env.APP_BASE_URL,
    trackUrl: trackUrl(token),
  });
  try {
    await emailProvider().send({ to: [to.email], subject: mail.subject, html: mail.html, text: mail.text, from: mail.from });
    await invitationsRepo.setStatus(invitationId, "SENT", { sentAt: new Date() });
    return true;
  } catch (err) {
    logger.error({ err, invitationId }, "onboarding email send failed — invitation left PENDING");
    return false;
  }
}

/** Create + send a fresh onboarding invitation for a newly provisioned user. */
export async function inviteUser(
  user: Recipient,
  labels: InviteLabels,
  actor: AuthContext | null,
  ip?: string,
): Promise<{ invitationId: string; emailSent: boolean }> {
  const token = newToken();
  const inv = await invitationsRepo.create(user.id, user.email, token, expiry());
  const emailSent = await dispatch(inv.id, token, user, labels);
  await audit(actor, {
    action: "invitation:send",
    entityType: "Invitation",
    entityId: inv.id,
    after: { email: user.email, emailSent },
    ip,
  });
  return { invitationId: inv.id, emailSent };
}

/** Resend: reissue the latest non-completed invite (or create one), then re-send. */
export async function resendForUser(
  user: Recipient,
  labels: InviteLabels,
  actor: AuthContext,
  ip?: string,
): Promise<{ invitationId: string; emailSent: boolean }> {
  const latest = await invitationsRepo.latestForUser(user.id);
  const token = newToken();
  let id: string;
  if (latest && latest.status !== "COMPLETED") {
    await invitationsRepo.reissue(latest.id, token, expiry());
    id = latest.id;
  } else {
    const inv = await invitationsRepo.create(user.id, user.email, token, expiry());
    id = inv.id;
  }
  const emailSent = await dispatch(id, token, user, labels);
  await audit(actor, { action: "invitation:resend", entityType: "Invitation", entityId: id, after: { emailSent }, ip });
  return { invitationId: id, emailSent };
}

/** Revoke an invitation: invalidate it and lock out the invitee if they haven't onboarded. */
export async function revokeInvitation(actor: AuthContext, id: string, ip?: string) {
  const inv = await invitationsRepo.findById(id);
  if (!inv) throw Errors.notFound("Invitation not found");
  if (inv.status === "COMPLETED") throw Errors.badRequest("Cannot revoke a completed invitation");
  await invitationsRepo.revoke(id);
  await invitationsRepo.deactivateIfInvited(inv.userId);
  await audit(actor, { action: "invitation:revoke", entityType: "Invitation", entityId: id, after: { email: inv.email }, ip });
  return { id, status: "EXPIRED" as const };
}

/** Open-tracking — mark OPENED when the pixel is fetched. Idempotent; never past COMPLETED. */
export async function markOpenedByToken(token: string): Promise<void> {
  const inv = await invitationsRepo.findByToken(token);
  if (!inv || inv.status === "COMPLETED" || inv.openedAt) return;
  await invitationsRepo.setStatus(inv.id, "OPENED", { openedAt: new Date() });
}

/** Completion — called on a user's first successful Google sign-in. */
export async function completeForUser(userId: string): Promise<void> {
  const latest = await invitationsRepo.latestForUser(userId);
  if (!latest || latest.status === "COMPLETED") return;
  await invitationsRepo.setStatus(latest.id, "COMPLETED", { acceptedAt: new Date() });
}

/** Status view for the admin/LCC invitations UI (auto-expires stale rows in the projection). */
export async function listInvitations(take = 100, skip = 0) {
  const rows = await invitationsRepo.list(take, skip);
  const now = Date.now();
  return {
    items: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.user?.fullName ?? null,
      role: r.user?.roles[0]?.role ?? null,
      domainKey: r.user?.teamMemberships[0]?.team.domain?.key ?? null,
      team: r.user?.teamMemberships[0]?.team.name ?? null,
      status: r.status !== "COMPLETED" && r.expiresAt.getTime() < now ? "EXPIRED" : r.status,
      sentAt: r.sentAt,
      openedAt: r.openedAt,
      acceptedAt: r.acceptedAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    })),
  };
}
