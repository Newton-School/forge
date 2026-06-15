import { z } from "zod";

export const RoleEnum = z.enum(["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"]);
export const ScopeTypeEnum = z.enum(["GLOBAL", "DOMAIN", "TEAM", "SELF"]);
export const StatusEnum = z.enum(["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"]);

export const createUserSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  fullName: z.string().min(1).max(120),
  role: RoleEnum,
  scopeType: ScopeTypeEnum.default("SELF"),
  scopeId: z.string().optional().nullable(),
  status: StatusEnum.default("INVITED"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  status: StatusEnum.optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignRoleSchema = z.object({
  role: RoleEnum,
  scopeType: ScopeTypeEnum,
  scopeId: z.string().optional().nullable(),
});
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const listUsersQuery = z.object({
  status: StatusEnum.optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListUsersQuery = z.infer<typeof listUsersQuery>;
