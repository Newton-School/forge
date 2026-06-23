import Link from "next/link";
import { GitBranch } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import type { OrgAnalytics } from "@/lib/session";

/** Real project comparison: the org's team-repos grouped by project key (from `<project>_<teamN>`). */
export function OrgProjectsLive({ data }: { data: OrgAnalytics }) {
  const byProject = new Map<string, OrgAnalytics["teamRows"]>();
  for (const t of data.teamRows) byProject.set(t.project, [...(byProject.get(t.project) ?? []), t]);
  const projects = [...byProject.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects found in the organization yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {projects.map(([key, rows]) => (
        <SectionCard
          key={key}
          title={key}
          action={<Badge tone={rows.length > 1 ? "primary" : "neutral"}>{rows.length > 1 ? `${rows.length} teams` : "1 team"}</Badge>}
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Team repo</th>
                <th className="px-4 py-2 text-right font-medium">Commits</th>
                <th className="px-4 py-2 text-right font-medium">Contributors</th>
                <th className="px-4 py-2 text-right font-medium">PRs</th>
                <th className="px-4 py-2 text-right font-medium">Issues</th>
              </tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.repo} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/github/repos/${encodeURIComponent(t.repo)}`} className="flex items-center gap-1.5 font-medium hover:underline">
                        <GitBranch className="size-3.5 text-muted-foreground" /> {t.repo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.commits}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.contributors}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.prs} <span className="text-subtle-foreground">({t.mergedPrs}✓)</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.openIssues} <span className="text-subtle-foreground">open</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
