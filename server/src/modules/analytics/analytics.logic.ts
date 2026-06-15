/**
 * Pure aggregation helpers for analytics rollups — no I/O, fully unit-tested.
 * The repository returns raw rows/counts; these functions shape them into the
 * per-domain and headline numbers the dashboards render.
 */

/** Rounded percentage in [0, 100]; 0 when the whole is 0 (no divide-by-zero). */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export interface DomainRef {
  id: string;
  key: string;
  name: string;
}
export interface TeamRow {
  domainId: string;
  members: number;
  hasMentor: boolean;
}
export interface DomainRollup extends DomainRef {
  teams: number;
  students: number;
  mentors: number;
}

/** Roll a flat list of teams up into per-domain team/student/mentor counts. */
export function rollupDomains(domains: DomainRef[], teams: TeamRow[]): DomainRollup[] {
  return domains.map((d) => {
    const own = teams.filter((t) => t.domainId === d.id);
    return {
      ...d,
      teams: own.length,
      students: own.reduce((s, t) => s + t.members, 0),
      mentors: own.filter((t) => t.hasMentor).length,
    };
  });
}

/** Sum the per-domain rollups into a single headline total. */
export function totals(rollups: DomainRollup[]) {
  return {
    domains: rollups.length,
    teams: rollups.reduce((s, r) => s + r.teams, 0),
    students: rollups.reduce((s, r) => s + r.students, 0),
    mentors: rollups.reduce((s, r) => s + r.mentors, 0),
  };
}
