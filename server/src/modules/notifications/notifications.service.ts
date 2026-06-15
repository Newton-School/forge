import type { Prisma } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import type { AuthContext } from "../../rbac/types.js";
import { notificationsRepo } from "./notifications.repository.js";
import type { ListNotificationsQuery } from "./notifications.schema.js";

export async function listNotifications(ctx: AuthContext, q: ListNotificationsQuery) {
  const [items, unread] = await Promise.all([
    notificationsRepo.listForUser(ctx.id, q.unread, q.take, q.skip),
    notificationsRepo.unreadCount(ctx.id),
  ]);
  return { items, unread };
}

export async function unreadCount(ctx: AuthContext) {
  return { unread: await notificationsRepo.unreadCount(ctx.id) };
}

export async function markRead(ctx: AuthContext, id: string) {
  const r = await notificationsRepo.markRead(id, ctx.id, new Date());
  return { updated: r.count };
}

export async function markAllRead(ctx: AuthContext) {
  const r = await notificationsRepo.markAllRead(ctx.id, new Date());
  return { updated: r.count };
}

/**
 * Internal producer — other modules call this to deliver an in-app notification.
 * Never throws into the caller's path: a failed notification must not roll back
 * the action that triggered it (availability over a lost notice), so it's logged.
 */
export async function emitNotification(userId: string, type: string, payload: Prisma.InputJsonValue): Promise<void> {
  try {
    await notificationsRepo.create(userId, type, payload);
  } catch (err) {
    logger.error({ err, type, userId }, "notification emit failed");
  }
}
