/**
 * Public landing metrics, fetched from the server's read-only `/public/stats`
 * endpoint. Runs server-side in the marketing Server Component and is ISR-cached,
 * so the browser never calls it directly. Never throws: any failure degrades to
 * "no data" so the Analytics section renders its "Coming Soon" state.
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

export type MetricKey = keyof PublicStats["metrics"];

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

export async function getPublicStats(): Promise<PublicStats> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return EMPTY;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/public/stats`, {
      next: { revalidate: 300 }, // refresh at most every 5 min
    });
    if (!res.ok) return EMPTY;
    return (await res.json()) as PublicStats;
  } catch {
    return EMPTY;
  }
}
