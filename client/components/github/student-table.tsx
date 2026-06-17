import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ghTeam, type StudentAnalytics } from "@/lib/api";

/** Student contribution table — GitHub throughput + learning-eval averages. */
export function StudentTable({ students, showTeam = true }: { students: StudentAnalytics[]; showTeam?: boolean }) {
  const rate = (v: number): "success" | "warning" | "danger" => (v >= 67 ? "success" : v >= 34 ? "warning" : "danger");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          {showTeam ? <TableHead>Team</TableHead> : null}
          <TableHead className="text-right">Attempted</TableHead>
          <TableHead className="text-right">Solved</TableHead>
          <TableHead className="text-right">PRs</TableHead>
          <TableHead className="text-right">Merged</TableHead>
          <TableHead className="text-right">Acceptance</TableHead>
          <TableHead className="text-right">Commits</TableHead>
          <TableHead className="text-right">Understanding</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.userId}>
            <TableCell className="font-medium">{s.name} <span className="font-mono text-[11px] text-subtle-foreground">@{s.login}</span></TableCell>
            {showTeam ? <TableCell className="text-muted-foreground">{ghTeam(s.teamId)?.name ?? "—"}</TableCell> : null}
            <TableCell className="text-right tabular-nums">{s.issuesAttempted}</TableCell>
            <TableCell className="text-right tabular-nums">{s.issuesSolved}</TableCell>
            <TableCell className="text-right tabular-nums">{s.prsRaised}</TableCell>
            <TableCell className="text-right tabular-nums">{s.prsMerged}</TableCell>
            <TableCell className="text-right"><Badge tone={rate(s.acceptanceRate)}>{s.acceptanceRate}%</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{s.commits}</TableCell>
            <TableCell className="text-right tabular-nums">{s.avgUnderstanding || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
