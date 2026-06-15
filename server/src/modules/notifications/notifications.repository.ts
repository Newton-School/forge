import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";

/** Data access for per-user in-app notifications. Every query is keyed by userId. */
export const notificationsRepo = {
  listForUser: (userId: string, unread: boolean | undefined, take: number, skip: number) =>
    prisma.notification.findMany({
      where: { userId, ...(unread === undefined ? {} : { readAt: unread ? null : { not: null } }) },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),

  unreadCount: (userId: string) => prisma.notification.count({ where: { userId, readAt: null } }),

  /** Mark one notification read — scoped to the owner so users can't touch others'. */
  markRead: (id: string, userId: string, at: Date) =>
    prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: at } }),

  markAllRead: (userId: string, at: Date) =>
    prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: at } }),

  create: (userId: string, type: string, payload: Prisma.InputJsonValue) =>
    prisma.notification.create({ data: { userId, type, payload } }),
};
