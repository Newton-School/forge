import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { OrgContributor } from "@/lib/session";

/** Real org-wide student contributions, from `/integrations/github/org/contributors`. */
export function OrgStudentsLive({ rows }: { rows: OrgContributor[] }) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No contributor activity in the organization yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Contributor</th>
            <th className="px-4 py-2 text-right font-medium">Repos</th>
            <th className="px-4 py-2 text-right font-medium">Commits</th>
            <th className="px-4 py-2 text-right font-medium">PRs</th>
            <th className="px-4 py-2 text-right font-medium">Merged</th>
            <th className="px-4 py-2 text-right font-medium">Issues</th>
            <th className="px-4 py-2 text-right font-medium">Acceptance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.login} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <Avatar className="size-6"><AvatarFallback className="text-[10px]">{initials(s.login)}</AvatarFallback></Avatar>
                  <span className="font-medium">{s.login}</span>
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{s.repos}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{s.commits}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{s.prsRaised}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{s.prsMerged}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{s.issuesOpened}</td>
              <td className="px-4 py-2.5 text-right">
                <Badge tone={s.acceptanceRate >= 70 ? "success" : s.acceptanceRate >= 40 ? "warning" : "neutral"}>{s.acceptanceRate}%</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
