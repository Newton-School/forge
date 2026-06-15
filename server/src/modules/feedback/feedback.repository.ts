import { prisma } from "../../lib/db.js";
import type { SubmitMentorFeedbackInput } from "./feedback.schema.js";

/**
 * Data access for 360° mentor feedback. The model stores bare mentor/mentee ids
 * (no relations), so domain scoping resolves the relevant mentor ids here.
 */
export const feedbackRepo = {
  /** Mentor ids who lead a team in any of the given domains (for domain-scoped reads). */
  mentorIdsInDomains: async (domainIds: string[]): Promise<string[]> => {
    const teams = await prisma.team.findMany({
      where: { domainId: { in: domainIds }, mentorId: { not: null } },
      select: { mentorId: true },
    });
    return [...new Set(teams.map((t) => t.mentorId).filter((id): id is string => id !== null))];
  },

  /** Is `mentorId` the mentor of a team that `menteeId` belongs to? */
  isMentorOfMentee: async (mentorId: string, menteeId: string): Promise<boolean> => {
    const m = await prisma.teamMember.findFirst({
      where: { userId: menteeId, team: { mentorId } },
      select: { id: true },
    });
    return m !== null;
  },

  create: (menteeId: string, input: SubmitMentorFeedbackInput) =>
    prisma.mentorFeedback.create({
      data: {
        menteeId,
        mentorId: input.mentorId,
        mentorAvailable: input.mentorAvailable,
        feedbackUseful: input.feedbackUseful,
        comments: input.comments ?? null,
      },
    }),

  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.mentorFeedback.findMany({ where, orderBy: { date: "desc" }, take, skip }),
};
