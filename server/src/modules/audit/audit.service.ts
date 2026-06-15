import type { AuthContext } from "../../rbac/types.js";
import { auditReadRepo } from "./audit.repository.js";
import type { ListAuditQuery } from "./audit.schema.js";

/**
 * Read the audit log. Gated by `auditLog:read` (Admin/LCC, both GLOBAL), so there is
 * no row-level scoping — the audit trail is intentionally a complete, tamper-evident
 * record for those roles. Filters narrow by entity/actor/action.
 */
export async function listAudit(_ctx: AuthContext, q: ListAuditQuery) {
  const where: Record<string, unknown> = {
    ...(q.entityType ? { entityType: q.entityType } : {}),
    ...(q.entityId ? { entityId: q.entityId } : {}),
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.action ? { action: q.action } : {}),
  };
  const [items, total] = await Promise.all([
    auditReadRepo.list(where, q.take, q.skip),
    auditReadRepo.count(where),
  ]);
  return { items, total };
}
