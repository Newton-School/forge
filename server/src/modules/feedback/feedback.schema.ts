import { z } from "zod";

/** A mentee's confidential 360° rating of their mentor. */
export const submitMentorFeedbackSchema = z.object({
  mentorId: z.string().min(1),
  mentorAvailable: z.boolean(),
  feedbackUseful: z.boolean(),
  comments: z.string().max(1000).optional(),
});
export type SubmitMentorFeedbackInput = z.infer<typeof submitMentorFeedbackSchema>;

export const listMentorFeedbackQuery = z.object({
  mentorId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListMentorFeedbackQuery = z.infer<typeof listMentorFeedbackQuery>;
