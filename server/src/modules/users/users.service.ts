import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import type { AuthContext, RoleGrant } from "../../rbac/types.js";
import { usersRepo, type DerivedScope, type UserWithRoles } from "./users.repository.js";
import { inviteUser, resendForUser, type InviteLabels } from "../invitations/invitations.service.js";
import { roleKeys } from "../../rbac/policy.js";
import type { AssignRoleInput, CreateUserInput, ListUsersQuery, RoleEnum, UpdateUserInput } from "./users.schema.js";
import type { z } from "zod";

/** "MENTEE" → "Mentee" (LCC/Admin kept as-is) for the onboarding email. */
function roleLabel(role: z.infer<typeof RoleEnum>): string {
  if (role === "LCC" || role === "ADMIN") return role === "ADMIN" ? "Admin" : "LCC";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

/**
 * Derive the role grant's scope from the assignment. Explicit scopeType (API callers)
 * wins; otherwise: Admin/LCC → GLOBAL, Teacher → their DOMAIN, Mentor/Mentee → their TEAM.
 */
function deriveScope(input: CreateUserInput, teamId: string | null): DerivedScope {
  if (input.scopeType) return { scopeType: input.scopeType, scopeId: input.scopeId ?? null };
  if (input.role === "ADMIN" || input.role === "LCC") return { scopeType: "GLOBAL", scopeId: null };
  if (input.role === "TEACHER" && input.domainId) return { scopeType: "DOMAIN", scopeId: input.domainId };
  if ((input.role === "MENTOR" || input.role === "MENTEE") && teamId) return { scopeType: "TEAM", scopeId: teamId };
  return { scopeType: "SELF", scopeId: null };
}

/**
 * Privilege-escalation guard: the route gate (`user:create`/`role:assign`) only confirms the actor
 * MAY onboard — it doesn't bound WHAT they may grant. Both ADMIN and LCC pass that gate, but an LCC
 * must not be able to mint an Admin or any GLOBAL-scoped principal (which would elevate past their
 * tier). Only an actual Admin may grant the Admin role or GLOBAL scope.
 */
function assertCanGrant(actor: AuthContext, role: string, scopeType: string | undefined): void {
  if (roleKeys(actor).includes("ADMIN")) return; // Admin may grant anything
  if (role === "ADMIN") throw Errors.forbidden("Only an Admin can grant the Admin role");
  if (scopeType === "GLOBAL") throw Errors.forbidden("Only an Admin can grant global scope");
}

/** Onboarding-email labels from an existing user's role grant (resend path). */
async function labelsFromGrant(grant: RoleGrant | undefined): Promise<InviteLabels> {
  const role = roleLabel((grant?.role ?? "MENTEE") as CreateUserInput["role"]);
  if (grant?.scopeType === "TEAM" && grant.scopeId) return { role, ...(await usersRepo.labelsFor(null, grant.scopeId)) };
  if (grant?.scopeType === "DOMAIN" && grant.scopeId) return { role, ...(await usersRepo.labelsFor(grant.scopeId, null)) };
  return { role, domain: "—", team: "—" };
}

/** Public shape returned to clients — never leaks password/mfa fields. */
export function toUserDto(u: NonNullable<UserWithRoles>) {
  const membership = u.teamMemberships[0];
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    status: u.status,
    avatarUrl: u.avatarUrl,
    githubUsername: u.githubUsername,
    discordUsername: u.discordUsername,
    roles: u.roles.map((r) => ({ role: r.role, scopeType: r.scopeType, scopeId: r.scopeId })),
    // Display context for the admin/LCC user lists — the member's team and its domain key.
    domainKey: membership?.team.domain?.key ?? null,
    teamName: membership?.team.name ?? null,
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

  // Place a mentee on their mentor's team when no team is given explicitly.
  let teamId = input.teamId ?? null;
  if (!teamId && input.mentorId) teamId = await usersRepo.mentorTeamId(input.mentorId);
  const scope = deriveScope(input, teamId);
  assertCanGrant(actor, input.role, scope.scopeType); // an LCC cannot mint an Admin / GLOBAL user

  const created = await usersRepo.create(input, scope, teamId, actor.id);
  await audit(actor, {
    action: "user:create", entityType: "User", entityId: created.id,
    after: { email: created.email, role: input.role, scope: scope.scopeType, teamId }, ip,
  });

  // Provisioned users (status INVITED, the default) get an onboarding invitation + email.
  let invitation: { invitationId: string; emailSent: boolean } | null = null;
  if (created.status === "INVITED") {
    const { domain, team } = await usersRepo.labelsFor(input.domainId ?? null, teamId);
    invitation = await inviteUser(
      { id: created.id, email: created.email, fullName: created.fullName },
      { role: roleLabel(input.role), domain, team },
      actor,
      ip,
    );
  }
  return { ...toUserDto(created), invitation };
}

/** Resend the onboarding invitation for an existing (not-yet-completed) user. */
export async function resendInvitation(actor: AuthContext, id: string, ip?: string) {
  const user = await usersRepo.findById(id);
  if (!user) throw Errors.notFound("User not found");
  const labels = await labelsFromGrant(user.roles[0] as RoleGrant | undefined);
  return resendForUser({ id: user.id, email: user.email, fullName: user.fullName }, labels, actor, ip);
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
  assertCanGrant(actor, input.role, input.scopeType); // an LCC cannot elevate anyone to Admin / GLOBAL
  await usersRepo.addRole(id, input);
  await audit(actor, { action: "role:assign", entityType: "User", entityId: id, after: input, ip });
  return getUser(id);
}
