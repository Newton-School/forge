import { Badge } from "@/components/ui/badge";
import type { OrgRoster, OrgAnalytics } from "@/lib/session";

/** Real mentor view: each team-repo's mentor (from the org roster) + that repo's live throughput. */
export function OrgMentorsLive({ roster, org }: { roster: OrgRoster; org: OrgAnalytics | null }) {
  const statsByRepo = new Map((org?.teamRows ?? []).map((t) => [t.repo, t]));
  const rows = roster.teams.filter((t) => t.mentor || t.mentors.length);

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No mentor roster available{roster.source === "derived" ? " — the GitHub token can't read org Teams yet (needs Members: Read-only)." : "."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Mentor</th>
            <th className="px-4 py-2 font-medium">Team repo</th>
            <th className="px-4 py-2 text-right font-medium">Students</th>
            <th className="px-4 py-2 text-right font-medium">Commits</th>
            <th className="px-4 py-2 text-right font-medium">PRs</th>
            <th className="px-4 py-2 text-right font-medium">Merged</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const s = t.repo ? statsByRepo.get(t.repo) : undefined;
            return (
              <tr key={t.slug} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2.5 font-medium">{t.mentor ?? t.mentors[0] ?? "—"}</td>
                <td className="px-4 py-2.5"><Badge tone="neutral">{t.repo ?? t.name}</Badge></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{t.students.length}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s?.commits ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s?.prs ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s?.mergedPrs ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
