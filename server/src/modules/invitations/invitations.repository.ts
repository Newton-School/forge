import { prisma } from "../../lib/db.js";
import type { InvitationStatus } from "@prisma/client";

/** Data access for onboarding invitations — the only place these queries live. */
export const invitationsRepo = {
  create: (userId: string, email: string, token: string, expiresAt: Date) =>
    prisma.invitation.create({ data: { userId, email, token, expiresAt, status: "PENDING" } }),

  findByToken: (token: string) => prisma.invitation.findUnique({ where: { token } }),

  findById: (id: string) => prisma.invitation.findUnique({ where: { id } }),

  /** Revoke: mark EXPIRED and force-expire the token so it can never complete. */
  revoke: (id: string) =>
    prisma.invitation.update({ where: { id }, data: { status: "EXPIRED", expiresAt: new Date(0) } }),

  /** Lock out a not-yet-onboarded invitee (a completed/active user is left untouched). */
  deactivateIfInvited: (userId: string) =>
    prisma.user.updateMany({ where: { id: userId, status: "INVITED" }, data: { status: "DEACTIVATED" } }),

  /** Most recent invitation for a user (completion + resend targeting). */
  latestForUser: (userId: string) =>
    prisma.invitation.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),

  setStatus: (
    id: string,
    status: InvitationStatus,
    fields: { sentAt?: Date; openedAt?: Date; acceptedAt?: Date } = {},
  ) => prisma.invitation.update({ where: { id }, data: { status, ...fields } }),

  /** Reissue an existing invitation: fresh token + expiry, reset tracking, back to PENDING. */
  reissue: (id: string, token: string, expiresAt: Date) =>
    prisma.invitation.update({
      where: { id },
      data: { token, expiresAt, status: "PENDING", sentAt: null, openedAt: null, acceptedAt: null },
    }),

  list: (take: number, skip: number) =>
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { user: { select: { fullName: true, email: true } } },
    }),
};
