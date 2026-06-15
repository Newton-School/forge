import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import type { AuthContext } from "../../rbac/types.js";
import { usersRepo, type UserWithRoles } from "./users.repository.js";
import type { AssignRoleInput, CreateUserInput, ListUsersQuery, UpdateUserInput } from "./users.schema.js";

/** Public shape returned to clients — never leaks password/mfa fields. */
export function toUserDto(u: NonNullable<UserWithRoles>) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    status: u.status,
    avatarUrl: u.avatarUrl,
    githubUsername: u.githubUsername,
    discordUsername: u.discordUsername,
    roles: u.roles.map((r) => ({ role: r.role, scopeType: r.scopeType, scopeId: r.scopeId })),
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

export async function listUsers(q: ListUsersQuery) {
  const [rows, total] = await Promise.all([usersRepo.list(q), usersRepo.count(q)]);
  return { items: rows.map(toUserDto), total, take: q.take, skip: q.skip };
}

export async function getUser(id: string) {
  const u = await usersRepo.findById(id);
  if (!u) throw Errors.notFound("User not found");
  return toUserDto(u);
}

export async function createUser(actor: AuthContext, input: CreateUserInput, ip?: string) {
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) throw Errors.conflict("A user with that email already exists");
  const created = await usersRepo.create(input, actor.id);
  await audit(actor, { action: "user:create", entityType: "User", entityId: created.id, after: { email: created.email, role: input.role }, ip });
  return toUserDto(created);
}

export async function updateUser(actor: AuthContext, id: string, input: UpdateUserInput, ip?: string) {
  const before = await usersRepo.findById(id);
  if (!before) throw Errors.notFound("User not found");
  const updated = await usersRepo.update(id, input);
  await audit(actor, { action: "user:update", entityType: "User", entityId: id, before: { status: before.status, fullName: before.fullName }, after: input, ip });
  return toUserDto(updated);
}

export async function assignRole(actor: AuthContext, id: string, input: AssignRoleInput, ip?: string) {
  const user = await usersRepo.findById(id);
  if (!user) throw Errors.notFound("User not found");
  await usersRepo.addRole(id, input);
  await audit(actor, { action: "role:assign", entityType: "User", entityId: id, after: input, ip });
  return getUser(id);
}
