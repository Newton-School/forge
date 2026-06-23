import Link from "next/link";
import { GitBranch, Users, GitPullRequest, CircleDot, GitMerge, UsersRound } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import type { OrgAnalytics } from "@/lib/session";

/**
 * Read-only AI-org overview rendered from REAL GitHub data (the `/integrations/github/org/analytics`
 * aggregate). Mirrors the mock OrgOverview's layout but is driven entirely by live org reads — no
 * fixtures. Used by the LCC / Admin / Teacher AI dashboards in production.
 */
export function OrgOverviewLive({ data }: { data: OrgAnalytics }) {
  return (
    <div className="flex flex-col gap-6">
      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Repositories" value={data.repos} icon={<GitBranch />} />
        <StatCard label="Teams" value={data.teams} icon={<UsersRound />} />
        <StatCard label="Contributors" value={data.contributors} icon={<Users />} />
        <StatCard label="Commits" value={data.commits} icon={<GitMerge />} />
        <StatCard label="Open issues" value={data.openIssues} sub={`${data.closedIssues} closed`} icon={<CircleDot />} />
        <StatCard label="Pull requests" value={data.prs} sub={`${data.mergedPrs} merged · ${data.openPrs} open`} icon={<GitPullRequest />} />
        <StatCard label="Merged PRs" value={data.mergedPrs} icon={<GitMerge />} />
        <StatCard label="Open PRs" value={data.openPrs} icon={<GitPullRequest />} />
      </StatGrid>

      <SectionCard title="Team repositories" bodyClassName="p-0">
        {data.teamRows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No repositories found in the organization yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Repository</th>
                  <th className="px-4 py-2 font-medium">Project</th>
                  <th className="px-4 py-2 text-right font-medium">Commits</th>
                  <th className="px-4 py-2 text-right font-medium">Contributors</th>
                  <th className="px-4 py-2 text-right font-medium">PRs</th>
                  <th className="px-4 py-2 text-right font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {data.teamRows.map((t) => (
                  <tr key={t.repo} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/github/repos/${encodeURIComponent(t.repo)}`} className="flex items-center gap-1.5 font-medium hover:underline">
                        <GitBranch className="size-3.5 text-muted-foreground" /> {t.repo}
                      </Link>
                      <span className="font-mono text-[11px] text-subtle-foreground">{t.fullName}</span>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone="neutral">{t.project}</Badge></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.commits}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.contributors}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {t.prs}
                      <span className="text-subtle-foreground"> ({t.mergedPrs}✓ · {t.openPrs} open)</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {t.openIssues}
                      <span className="text-subtle-foreground"> open · {t.closedIssues} closed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
