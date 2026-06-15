import { z } from "zod";

/** L1 — mentee update (every ~2 days). */
export const submitUpdateSchema = z.object({
  workedOn: z.string().min(1).max(500),
  learning: z.string().min(1).max(500),
  blocker: z.string().max(500).optional().nullable(),
  nextGoal: z.string().min(1).max(500),
});
export type SubmitUpdateInput = z.infer<typeof submitUpdateSchema>;

/** L2 — mentor status for a mentee. */
export const mentorStatusSchema = z.object({
  menteeId: z.string().min(1),
  statusL2: z.enum(["DOING_WELL", "NEEDS_CONSISTENCY", "NO_UPDATES_4PLUS"]),
  comment: z.string().max(1000).optional(),
  actionNeeded: z.string().max(500).optional(),
});
export type MentorStatusInput = z.infer<typeof mentorStatusSchema>;

/** L3 — mentor weekly review (upserted per mentee+week). */
export const weeklyReviewSchema = z.object({
  menteeId: z.string().min(1),
  weekNo: z.coerce.number().int().min(1).max(52),
  progressSummary: z.string().max(2000).optional(),
  strength: z.string().max(1000).optional(),
  improvementArea: z.string().max(1000).optional(),
  mentorStatus: z.enum(["ON_TRACK", "AT_RISK", "NEEDS_DISCUSSION"]),
});
export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>;

/** L4 — teacher decision on a weekly review. */
export const teacherDecisionSchema = z.object({
  decision: z.enum(["CONTINUE", "MONITOR", "SCHEDULE_DISCUSSION"]),
  notes: z.string().max(2000).optional(),
});
export type TeacherDecisionInput = z.infer<typeof teacherDecisionSchema>;

export const listUpdatesQuery = z.object({
  menteeId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListUpdatesQuery = z.infer<typeof listUpdatesQuery>;

export const listWeeklyQuery = z.object({
  weekNo: z.coerce.number().int().min(1).max(52).optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListWeeklyQuery = z.infer<typeof listWeeklyQuery>;
