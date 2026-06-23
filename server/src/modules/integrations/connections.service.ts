import { prisma } from "../../lib/db.js";
import { githubOAuthConfigured, discordOAuthConfigured } from "../../config/env.js";
import type { AuthContext } from "../../rbac/types.js";

/** A user's real, per-provider connection snapshot — drives the Connections page (production). */
export interface ConnectionsDto {
  github: { connected: boolean; username: string | null; connectedAt: string | null; configured: boolean };
  discord: { connected: boolean; username: string | null; configured: boolean };
  repo: {
    mode: "org" | "shared" | "per_student";
    canConnect: boolean;
    teamId: string | null;
    url: string | null;
    name: string | null;
    orgMode: boolean;
  };
  // Calendar is NOT a per-user OAuth in this architecture — drive events are delivered in-app by
  // scope (and optionally mirrored to one shared Google calendar via the service account).
  calendar: { mode: "inapp" };
}

const REPO_ROLES = new Set(["MENTOR", "TEACHER", "ADMIN", "LCC"]);

/** Read the current user's verified identities + their team's bound repo straight from the DB. */
export async function getConnections(ctx: AuthContext): Promise<ConnectionsDto> {
  const user = await prisma.user.findUnique({
    where: { id: ctx.id },
    select: {
      githubUsername: true,
      githubConnectedAt: true,
      discordUsername: true,
      teamMemberships: {
        take: 1,
        select: {
          githubRepoUrl: true, // the caller's OWN repo (PER_STUDENT domains)
          githubRepoName: true,
          team: {
            select: {
              id: true,
              githubRepoUrl: true, // the shared team repo (SHARED domains)
              githubRepoName: true,
              domain: { select: { githubRepoModel: true } },
            },
          },
        },
      },
    },
  });

  const membership = user?.teamMemberships[0] ?? null;
  const team = membership?.team ?? null;
  const model = team?.domain?.githubRepoModel ?? "SHARED"; // ORG | SHARED | PER_STUDENT
  const mode = model === "ORG" ? "org" : model === "PER_STUDENT" ? "per_student" : "shared";
  const roles = new Set(ctx.roles.map((r) => r.role));
  const canManage = [...roles].some((r) => REPO_ROLES.has(r));

  // PER_STUDENT: each member (incl. mentees) binds their OWN repo. SHARED: only mentor/teacher.
  const perStudent = mode === "per_student";
  const repoUrl = perStudent ? membership?.githubRepoUrl ?? null : team?.githubRepoUrl ?? null;
  const repoName = perStudent ? membership?.githubRepoName ?? null : team?.githubRepoName ?? null;

  return {
    github: {
      connected: Boolean(user?.githubUsername),
      username: user?.githubUsername ?? null,
      connectedAt: user?.githubConnectedAt?.toISOString() ?? null,
      configured: githubOAuthConfigured,
    },
    discord: {
      connected: Boolean(user?.discordUsername),
      username: user?.discordUsername ?? null,
      configured: discordOAuthConfigured,
    },
    repo: {
      mode,
      // org → read via the org (no connect); per_student → any member binds their own;
      // shared → only mentor/teacher binds the team repo.
      canConnect: Boolean(team) && (perStudent || (mode === "shared" && canManage)),
      teamId: team?.id ?? null,
      url: repoUrl,
      name: repoName,
      orgMode: mode === "org",
    },
    calendar: { mode: "inapp" },
  };
}
