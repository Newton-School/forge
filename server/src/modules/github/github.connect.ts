import type { AuthContext } from "../../rbac/types.js";
import { effectiveScope } from "../../rbac/policy.js";
import { env } from "../../config/env.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { githubRepo } from "./github.repository.js";
import { ensureRepoWebhook, ensureReadCollaborator, parseRepo } from "./github.hooks.js";
import { syncRepository } from "./repo.sync.js";
import {
  authorizeUrl,
  decodeState,
  encodeState,
  exchangeCode,
  fetchViewer,
  newNonce,
  type OAuthState,
} from "./github.oauth.js";

/** httpOnly cookie holding the state nonce — the CSRF binding across the redirect. */
export const STATE_COOKIE = "forge_gh_oauth";

export interface StartParams {
  repo?: string;
  teamId?: string;
  mine?: boolean;
}
export interface StartResult {
  url: string;
  nonce: string;
}

/** Build the consent redirect + the nonce the route stores in the state cookie. */
export function buildStart(p: StartParams): StartResult {
  const nonce = newNonce();
  const state: OAuthState = {
    n: nonce,
    repo: p.repo?.trim() || undefined,
    teamId: p.teamId?.trim() || undefined,
    mine: p.mine || undefined,
  };
  return { url: authorizeUrl(encodeState(state), Boolean(state.repo)), nonce };
}

export type CallbackStatus = "connected" | "repo_ok" | "repo_exists" | "repo_error" | "denied";
export interface CallbackResult {
  status: CallbackStatus;
  login?: string;
}

/** May this user bind a repo to the team? mentor of it · teacher of its domain · global. */
async function canBindTeam(ctx: AuthContext, teamId: string): Promise<boolean> {
  const team = await githubRepo.teamForBind(teamId);
  if (!team) return false;
  const s = effectiveScope(ctx);
  return s.global || s.teamIds.includes(team.id) || s.domainIds.includes(team.domainId);
}

/**
 * Handle the OAuth callback for the logged-in user: verify state, exchange the code,
 * store the *verified* username, and — when a repo was submitted and the user may bind
 * it — create the repo webhook. The user token is used here and then discarded; it is
 * never persisted.
 */
export async function handleCallback(
  ctx: AuthContext,
  code: string,
  rawState: string | undefined,
  cookieNonce: string | undefined,
  ip?: string,
): Promise<CallbackResult> {
  const state = decodeState(rawState);
  if (!state || !cookieNonce || state.n !== cookieNonce) return { status: "denied" };

  const token = await exchangeCode(code);
  const viewer = await fetchViewer(token);
  await githubRepo.setUserGithub(ctx.id, viewer.login, viewer.id);
  await audit(ctx, {
    action: "github.connect",
    entityType: "User",
    entityId: ctx.id,
    after: { login: viewer.login },
    ip,
  });

  // Username-only connect (students, or a mentor without a repo to wire).
  if (!state.repo || !state.teamId) return { status: "connected", login: viewer.login };

  // PER_STUDENT (ML): the user binds their OWN repo to their membership. Anyone who is actually a
  // member of that team may bind their own repo (self-scope) — no mentor/teacher gate.
  if (state.mine) {
    if (!(await githubRepo.isTeamMember(ctx.id, state.teamId))) {
      logger.warn({ userId: ctx.id, teamId: state.teamId }, "github member-repo bind denied (not a team member)");
      return { status: "connected", login: viewer.login };
    }
    const { owner, repo } = parseRepo(state.repo);
    const fullName = `${owner}/${repo}`;
    try {
      const hook = await ensureRepoWebhook(token, owner, repo);
      const readerAdded = await ensureReadCollaborator(token, owner, repo, env.GITHUB_READER_LOGIN);
      await githubRepo.setMemberRepo(ctx.id, state.teamId, `https://github.com/${fullName}`);
      await audit(ctx, {
        action: "github.connectMemberRepo", entityType: "TeamMember", entityId: ctx.id,
        after: { teamId: state.teamId, repo: fullName, webhookCreated: hook.created, readerAdded }, ip,
      });
      return { status: hook.created ? "repo_ok" : "repo_exists", login: viewer.login };
    } catch (err) {
      logger.error({ err, userId: ctx.id, repo: fullName }, "member repo webhook wiring failed");
      return { status: "repo_error", login: viewer.login };
    }
  }

  // SHARED (DVA/SDSE): repo binding is mentor/teacher/admin-only; an unauthorized attempt still
  // links the identity but silently refuses the repo (no leak of which teams exist).
  if (!(await canBindTeam(ctx, state.teamId))) {
    logger.warn({ userId: ctx.id, teamId: state.teamId }, "github repo bind denied (not the team's mentor/teacher)");
    return { status: "connected", login: viewer.login };
  }

  const { owner, repo } = parseRepo(state.repo);
  const fullName = `${owner}/${repo}`;
  try {
    const hook = await ensureRepoWebhook(token, owner, repo);
    // Add the Forge machine reader so reads + collaborator listing are durable (public repos).
    const readerAdded = await ensureReadCollaborator(token, owner, repo, env.GITHUB_READER_LOGIN);
    await githubRepo.setTeamRepo(state.teamId, `https://github.com/${fullName}`);
    // Capture repo meta + collaborators (owner token) + branches/releases into the DB now,
    // so the dashboards read from Forge and the collaborators list is populated.
    await syncRepository(state.teamId, owner, repo, token).catch((err) =>
      logger.warn({ err, teamId: state.teamId, repo: fullName }, "initial repository sync failed (will retry on demand)"),
    );
    await audit(ctx, {
      action: "github.connectRepo",
      entityType: "Team",
      entityId: state.teamId,
      after: { repo: fullName, webhookCreated: hook.created, readerAdded },
      ip,
    });
    return { status: hook.created ? "repo_ok" : "repo_exists", login: viewer.login };
  } catch (err) {
    logger.error({ err, teamId: state.teamId, repo: fullName }, "repo webhook wiring failed");
    return { status: "repo_error", login: viewer.login };
  }
}
