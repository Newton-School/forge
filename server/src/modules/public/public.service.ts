import { prisma } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";

/**
 * Public landing metrics. Only NON-SENSITIVE aggregate numbers — no per-user rows,
 * no PII, no identifiers. The read path serves a single precomputed snapshot row;
 * the recompute path is a secret-gated job. This keeps the public surface a pure
 * read of one cached row, never a query against live user data.
 */
export interface PublicStats {
  hasData: boolean;
  updatedAt: string | null;
  metrics: {
    contributionsTracked: number | null;
    prsReviewedPct: number | null;
    milestonesOnTrackPct: number | null;
    consistencyLiftPct: number | null;
  };
}

const EMPTY: PublicStats = {
  hasData: false,
  updatedAt: null,
  metrics: {
    contributionsTracked: null,
    prsReviewedPct: null,
    milestonesOnTrackPct: null,
    consistencyLiftPct: null,
  },
};

/**
 * Read the public snapshot. Read-only and resilient: any failure (e.g. the table
 * not migrated yet, or DB blip) degrades to "no data" so the landing page renders
 * its "Coming Soon" state rather than erroring.
 */
export async function getPublicStats(): Promise<PublicStats> {
  try {
    const row = await prisma.platformStat.findUnique({ where: { id: "current" } });
    if (!row) return EMPTY;
    const metrics = {
      contributionsTracked: row.contributionsTracked,
      prsReviewedPct: row.prsReviewedPct,
      milestonesOnTrackPct: row.milestonesOnTrackPct,
      consistencyLiftPct: row.consistencyLiftPct,
    };
    return {
      hasData: Object.values(metrics).some((v) => v !== null),
      updatedAt: row.computedAt.toISOString(),
      metrics,
    };
  } catch (err) {
    logger.warn({ err }, "public stats unavailable — serving empty (Coming Soon)");
    return EMPTY;
  }
}

/**
 * Recompute the snapshot from real data — counts and percentages only, never
 * individual rows. Called by the secret-gated job route (or a scheduled cron),
 * NOT from any public path.
 */
export async function recomputePlatformStats(): Promise<PublicStats> {
  const [activity, prCount, reviewCount, milestoneTotal, milestoneOnTrack] = await Promise.all([
    prisma.githubActivity.count(),
    prisma.githubActivity.count({ where: { type: "PR" } }),
    prisma.githubActivity.count({ where: { type: "REVIEW" } }),
    prisma.milestone.count(),
    prisma.milestone.count({
      where: { status: { in: ["IN_PROGRESS", "IN_REVIEW", "DONE", "RELEASED"] } },
    }),
  ]);

  const contributionsTracked = activity > 0 ? activity : null;
  const prsReviewedPct =
    prCount > 0 ? Math.min(100, Math.round((reviewCount / prCount) * 100)) : null;
  const milestonesOnTrackPct =
    milestoneTotal > 0 ? Math.round((milestoneOnTrack / milestoneTotal) * 100) : null;
  // Longitudinal metric — left null (Coming Soon) until enough update history exists.
  const consistencyLiftPct = null;

  await prisma.platformStat.upsert({
    where: { id: "current" },
    update: {
      contributionsTracked,
      prsReviewedPct,
      milestonesOnTrackPct,
      consistencyLiftPct,
      computedAt: new Date(),
    },
    create: {
      id: "current",
      contributionsTracked,
      prsReviewedPct,
      milestonesOnTrackPct,
      consistencyLiftPct,
    },
  });

  logger.info({ contributionsTracked }, "platform stats recomputed");
  return getPublicStats();
}
