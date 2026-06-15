import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { can } from "../../rbac/policy.js";
import { scopeWhere } from "../../rbac/scope.js";
import type { AuthContext } from "../../rbac/types.js";
import { orgRepo } from "./org.repository.js";
import type { AddMemberInput, CreateDomainInput, CreateTeamInput, UpdateDomainInput, UpdateTeamInput } from "./org.schema.js";

async function activeDrive(): Promise<string> {
  const id = await orgRepo.activeDriveId();
  if (!id) throw Errors.badRequest("No active drive — create one first");
  return id;
}

function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ── Domains (read = domain:read scope; write = domain:manage, Admin global) ────
export async function listDomains(ctx: AuthContext) {
  const where = { active: true, ...scopeWhere(ctx, { domainField: "id" }) };
  return { items: await orgRepo.listDomains(where) };
}

export async function createDomain(ctx: AuthContext, input: CreateDomainInput, ip?: string) {
  if (await orgRepo.domainKeyExists(input.key)) throw Errors.conflict("A domain with that key already exists");
  const domain = await orgRepo.createDomain(await activeDrive(), input);
  await audit(ctx, { action: "domain:create", entityType: "Domain", entityId: domain.id, after: { key: input.key, name: input.name }, ip });
  return domain;
}

export async function updateDomain(ctx: AuthContext, id: string, input: UpdateDomainInput, ip?: string) {
  if (!(await orgRepo.findDomain(id))) throw Errors.notFound("Domain not found");
  const domain = await orgRepo.updateDomain(id, defined({ key: input.key, name: input.name, active: input.active }));
  await audit(ctx, { action: "domain:update", entityType: "Domain", entityId: id, after: defined({ ...input }), ip });
  return domain;
}

// ── Teams (read = team:read scope; write = team:manage, Teacher own-domain) ────
export async function listTeams(ctx: AuthContext) {
  const teams = await orgRepo.listTeams(scopeWhere(ctx, { domainField: "domainId", teamField: "id" }));
  return {
    items: teams.map((t) => ({
      id: t.id, name: t.name, alias: t.alias, domainId: t.domainId,
      domainKey: t.domain?.key ?? null, mentor: t.mentor, members: t._count.members,
    })),
  };
}

export async function createTeam(ctx: AuthContext, input: CreateTeamInput, ip?: string) {
  if (!(await orgRepo.findDomain(input.domainId))) throw Errors.badRequest("Domain not found");
  if (!can(ctx, "team:manage", { domainId: input.domainId })) {
    throw Errors.forbidden("That domain is outside your scope");
  }
  if (input.mentorId && !(await orgRepo.userExists(input.mentorId))) throw Errors.badRequest("Mentor not found");
  const team = await orgRepo.createTeam(input);
  await audit(ctx, { action: "team:create", entityType: "Team", entityId: team.id, after: { name: input.name, domainId: input.domainId }, ip });
  return team;
}

/** Load a team and assert the caller may manage its domain. */
async function assertManageTeam(ctx: AuthContext, teamId: string) {
  const team = await orgRepo.findTeam(teamId);
  if (!team) throw Errors.notFound("Team not found");
  if (!can(ctx, "team:manage", { domainId: team.domainId, teamId: team.id })) {
    throw Errors.forbidden("This team is outside your scope");
  }
  return team;
}

export async function updateTeam(ctx: AuthContext, id: string, input: UpdateTeamInput, ip?: string) {
  await assertManageTeam(ctx, id);
  if (input.mentorId && !(await orgRepo.userExists(input.mentorId))) throw Errors.badRequest("Mentor not found");
  const team = await orgRepo.updateTeam(id, defined({
    name: input.name, alias: input.alias, mentorId: input.mentorId,
    githubRepoUrl: input.githubRepoUrl, discordChannelId: input.discordChannelId,
  }));
  await audit(ctx, { action: "team:update", entityType: "Team", entityId: id, ip });
  return team;
}

export async function addMember(ctx: AuthContext, teamId: string, input: AddMemberInput, ip?: string) {
  await assertManageTeam(ctx, teamId);
  if (!(await orgRepo.userExists(input.userId))) throw Errors.badRequest("User not found");
  const member = await orgRepo.addMember(teamId, input.userId, input.memberRole, input.squadId ?? null);
  await audit(ctx, { action: "team:addMember", entityType: "TeamMember", entityId: member.id, after: { teamId, userId: input.userId, memberRole: input.memberRole }, ip });
  return member;
}

export async function removeMember(ctx: AuthContext, teamId: string, userId: string, ip?: string) {
  await assertManageTeam(ctx, teamId);
  const result = await orgRepo.removeMember(teamId, userId);
  if (result.count === 0) throw Errors.notFound("Membership not found");
  await audit(ctx, { action: "team:removeMember", entityType: "TeamMember", before: { teamId, userId }, ip });
  return { removed: result.count };
}
