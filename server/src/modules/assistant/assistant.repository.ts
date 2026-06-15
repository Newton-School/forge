import { prisma } from "../../lib/db.js";

/** Data access for assistant context (read-only). */
export const assistantRepo = {
  menteeName: async (menteeId: string): Promise<string | null> => {
    const u = await prisma.user.findUnique({ where: { id: menteeId }, select: { fullName: true } });
    return u?.fullName ?? null;
  },

  /** Recent updates for a mentee, constrained to what the caller may see (scope `where`). */
  updatesInScope: (where: Record<string, unknown>, menteeId: string, take: number) =>
    prisma.menteeUpdate.findMany({
      where: { ...where, userId: menteeId },
      orderBy: { date: "desc" },
      take,
      select: { date: true, workedOn: true, learning: true, blocker: true, nextGoal: true },
    }),
};
