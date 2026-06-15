import { z } from "zod";

const TEAM_ALIAS = ["POD", "GROUP", "TEAM", "SQUAD"] as const;

// ── Domains (Admin only) ───────────────────────────────────────────────────────
export const createDomainSchema = z.object({
  key: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
});
export const updateDomainSchema = z
  .object({
    key: z.string().min(1).max(20).optional(),
    name: z.string().min(1).max(200).optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;

// ── Teams (Admin/LCC/Teacher — Teacher limited to own domain) ──────────────────
export const createTeamSchema = z.object({
  domainId: z.string().min(1),
  name: z.string().min(1).max(200),
  alias: z.enum(TEAM_ALIAS).default("TEAM"),
  mentorId: z.string().min(1).optional(),
  githubRepoUrl: z.string().url().max(500).optional(),
  discordChannelId: z.string().max(100).optional(),
});
export const updateTeamSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    alias: z.enum(TEAM_ALIAS).optional(),
    mentorId: z.string().min(1).nullish(),
    githubRepoUrl: z.string().url().max(500).nullish(),
    discordChannelId: z.string().max(100).nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// ── Membership ─────────────────────────────────────────────────────────────────
export const addMemberSchema = z.object({
  userId: z.string().min(1),
  memberRole: z.string().min(1).max(50),
  squadId: z.string().min(1).optional(),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
