import { prisma } from "./db.js";
import { logger } from "./logger.js";
import type { AuthContext } from "../rbac/types.js";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

/**
 * Append an immutable audit record. Never throws into the request path —
 * a failed audit write is logged, not propagated (availability over a lost log line),
 * but every privileged/mutating action must call this in its service.
 */
export async function audit(actor: AuthContext | null, e: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId ?? null,
        before: (e.before ?? undefined) as never,
        after: (e.after ?? undefined) as never,
        ip: e.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, action: e.action }, "audit write failed");
  }
}
