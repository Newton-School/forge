import type { Prisma } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import type { AuthContext } from "../../rbac/types.js";
import { notificationsRepo } from "./notifications.repository.js";
import type { ListNotificationsQuery } from "./notifications.schema.js";

/** "ANNOUNCEMENT" / "DEMERIT_ISSUED" / "ESCALATION:r1" → "Announcement" / "Demerit issued" / "Escalation". */
function notifLabel(type: string): string {
  const base = (type.split(":")[0] ?? type).replace(/_/g, " ").toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
/** Best human text from the (free-shape) payload, falling back to the type label. */
function notifText(type: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (typeof p.title === "string" && typeof p.body === "string") return `${p.title} — ${p.body}`;
  for (const k of ["text", "message", "title", "body", "reason", "note"]) {
    if (typeof p[k] === "string") return p[k] as string;
  }
  return notifLabel(type);
}
/** UI tone derived from the type keyword. */
function notifTone(type: string): "info" | "warning" | "danger" | "success" {
  if (/CRITICAL|FAIL|REJECT/.test(type)) return "danger";
  if (/DEMERIT|ESCALATION|BLOCK|OVERDUE/.test(type)) return "warning";
  if (/APPROV|COMPLETE|DONE|RESOLVED/.test(type)) return "success";
  return "info";
}

export async function listNotifications(ctx: AuthContext, q: ListNotificationsQuery) {
  const [rows, unread] = await Promise.all([
    notificationsRepo.listForUser(ctx.id, q.unread, q.take, q.skip),
    notificationsRepo.unreadCount(ctx.id),
  ]);
  const items = rows.map((n) => ({
    id: n.id,
    type: notifLabel(n.type),
    text: notifText(n.type, n.payload),
    tone: notifTone(n.type),
    unread: n.readAt === null,
    createdAt: n.createdAt,
  }));
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
