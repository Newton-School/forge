import { prisma } from "../../lib/db.js";

/** Read access for the immutable audit log (writes live in lib/audit.ts). */
export const auditReadRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.auditLog.findMany({
      where,
      orderBy: { at: "desc" },
      take,
      skip,
      select: {
        id: true, action: true, entityType: true, entityId: true,
        before: true, after: true, ip: true, at: true,
        actor: { select: { id: true, fullName: true, email: true } },
      },
    }),

  count: (where: Record<string, unknown>) => prisma.auditLog.count({ where }),
};
