import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";
import type { TargetInput } from "./email.schema.js";

/** Build a Prisma `User` where-filter from a recipient target. */
function recipientWhere(target: TargetInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { status: "ACTIVE" };
  if (target.teamId) where.teamMemberships = { some: { teamId: target.teamId } };
  else if (target.domainId) where.teamMemberships = { some: { team: { domainId: target.domainId } } };
  if (target.role && target.role !== "ALL") where.roles = { some: { role: target.role } };
  return where;
}

/** Data access for email, templates and announcements. */
export const emailRepo = {
  resolveRecipientEmails: async (target: TargetInput, cap: number): Promise<string[]> => {
    const users = await prisma.user.findMany({ where: recipientWhere(target), select: { email: true }, take: cap });
    return [...new Set(users.map((u) => u.email))];
  },

  resolveRecipientIds: async (target: TargetInput, cap: number): Promise<string[]> => {
    const users = await prisma.user.findMany({ where: recipientWhere(target), select: { id: true }, take: cap });
    return users.map((u) => u.id);
  },

  createEmail: (data: {
    senderId: string; subject: string; body: string; recipients: string[];
    cc?: string[]; status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED"; scheduledAt?: Date | null; templateId?: string | null;
  }) =>
    prisma.email.create({
      data: {
        senderId: data.senderId, subject: data.subject, body: data.body,
        recipients: data.recipients as Prisma.InputJsonValue,
        cc: (data.cc ?? undefined) as Prisma.InputJsonValue,
        status: data.status, scheduledAt: data.scheduledAt ?? null, templateId: data.templateId ?? null,
      },
    }),

  markStatus: (id: string, status: "SENT" | "FAILED", sentAt: Date | null) =>
    prisma.email.update({ where: { id }, data: { status, sentAt } }),

  listTemplates: () =>
    prisma.emailTemplate.findMany({ select: { id: true, name: true, subject: true, ownerRole: true, updatedAt: true }, orderBy: { name: "asc" } }),

  createAnnouncement: (authorId: string, data: { title: string; body: string; scopeType: string; scopeId?: string | null; channels: string[] }) =>
    prisma.announcement.create({
      data: { authorId, title: data.title, body: data.body, scopeType: data.scopeType, scopeId: data.scopeId ?? null, channels: data.channels as Prisma.InputJsonValue },
    }),
};
