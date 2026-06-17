import { SectionCard } from "@/components/dashboard/section-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TeamAnalytics } from "@/lib/api";

/** Side-by-side team comparison — the teacher's core lens (Team A vs B vs C). */
export function TeamCompare({ teams }: { teams: TeamAnalytics[] }) {
  const tone = (v: number): "success" | "primary" | "warning" => (v >= 75 ? "success" : v >= 50 ? "primary" : "warning");
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Comparison" description="Commits · PRs · merge rate · issues · milestone progress" bodyClassName="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Repo</TableHead>
              <TableHead className="text-right">Commits</TableHead>
              <TableHead className="text-right">PRs</TableHead>
              <TableHead className="text-right">Merge rate</TableHead>
              <TableHead className="text-right">Issues closed</TableHead>
              <TableHead className="text-right">Milestone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.teamId}>
                <TableCell className="font-medium">{t.teamName}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.repoName}</TableCell>
                <TableCell className="text-right tabular-nums">{t.commits}</TableCell>
                <TableCell className="text-right tabular-nums">{t.prs}</TableCell>
                <TableCell className="text-right tabular-nums">{t.prMergeRate}%</TableCell>
                <TableCell className="text-right tabular-nums">{t.closedIssues}</TableCell>
                <TableCell className="text-right"><Badge tone={tone(t.milestoneProgress)}>{t.milestoneProgress}%</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Commits" bodyClassName="p-4">
          <BarChart suffix="" data={teams.map((t) => ({ label: t.teamName, value: t.commits, tone: "primary" }))} />
        </SectionCard>
        <SectionCard title="PR merge rate" bodyClassName="p-4">
          <BarChart data={teams.map((t) => ({ label: t.teamName, value: t.prMergeRate, tone: tone(t.prMergeRate) }))} />
        </SectionCard>
        <SectionCard title="Milestone progress" bodyClassName="p-4">
          <BarChart data={teams.map((t) => ({ label: t.teamName, value: t.milestoneProgress, tone: tone(t.milestoneProgress) }))} />
        </SectionCard>
      </div>
    </div>
  );
}
