import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IssueStateBadge } from "./gh-badges";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ghRepo, prsForIssue, attemptsForIssue, type MockIssue } from "@/lib/api";

/** Issues table — issues are the unit of work; each links to its fan-out detail. */
export function IssueList({ issues }: { issues: MockIssue[] }) {
  if (issues.length === 0) return <EmptyState title="No issues" description="No issues match this view." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Issue</TableHead>
          <TableHead>Repo</TableHead>
          <TableHead className="text-right">Attempts</TableHead>
          <TableHead className="text-right">PRs</TableHead>
          <TableHead>State</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((i) => (
          <TableRow key={i.id}>
            <TableCell>
              <Link href={`/github/issues/${i.id}`} className="font-medium hover:underline">#{i.number} {i.title}</Link>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {i.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{ghRepo(i.repoId)?.name}</TableCell>
            <TableCell className="text-right tabular-nums">{attemptsForIssue(i.id).length}</TableCell>
            <TableCell className="text-right tabular-nums">{prsForIssue(i.id).length}</TableCell>
            <TableCell><IssueStateBadge state={i.state} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
