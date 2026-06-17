import { z } from "zod";

/** Recipient targeting for bulk sends / announcements. */
export const targetSchema = z.object({
  domainId: z.string().min(1).optional(),
  teamId: z.string().min(1).optional(),
  role: z.enum(["MENTEE", "MENTOR", "TEACHER", "LCC", "ADMIN", "ALL"]).optional(),
});
export type TargetInput = z.infer<typeof targetSchema>;

/** Direct send to explicit addresses. */
export const sendEmailSchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  to: z.array(z.string().email()).min(1).max(200),
  cc: z.array(z.string().email()).max(50).optional(),
  templateId: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

/** Targeted bulk send (recipients resolved server-side, capped). */
export const bulkSendSchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  target: targetSchema,
  scheduledAt: z.coerce.date().optional(),
  templateId: z.string().optional(),
});
export type BulkSendInput = z.infer<typeof bulkSendSchema>;

/** Send [TEST] onboarding previews to reviewers (capped, marked TEST). */
export const testOnboardingSchema = z.object({
  recipients: z.array(z.string().email().transform((s) => s.toLowerCase())).min(1).max(20),
});
export type TestOnboardingInput = z.infer<typeof testOnboardingSchema>;

/** Announcement fanned out over in-app (and optionally email). */
export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  scopeType: z.enum(["GLOBAL", "DOMAIN", "TEAM"]).default("GLOBAL"),
  scopeId: z.string().min(1).optional(),
  channels: z.array(z.enum(["inapp", "email"])).min(1).default(["inapp"]),
  target: targetSchema.optional(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;
