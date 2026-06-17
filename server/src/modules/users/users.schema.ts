import { z } from "zod";

export const RoleEnum = z.enum(["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"]);
export const ScopeTypeEnum = z.enum(["GLOBAL", "DOMAIN", "TEAM", "SELF"]);
export const StatusEnum = z.enum(["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"]);

/** An optional id field: treats "" (unselected dropdown) as absent. */
const optionalId = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().min(1).optional(),
);

export const createUserSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  fullName: z.string().min(1).max(120),
  role: RoleEnum,
  status: StatusEnum.default("INVITED"),
  // Assignment — the UI sends these; the service derives the role's scope + team membership.
  domainId: optionalId,
  teamId: optionalId,
  mentorId: optionalId,
  // Explicit scope is still accepted (overrides derivation) for API / back-compat.
  scopeType: ScopeTypeEnum.optional(),
  scopeId: optionalId,
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
