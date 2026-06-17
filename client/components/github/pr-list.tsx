import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRStateBadge } from "./gh-badges";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ghRepo, personName, reviewForPR, type MockPR } from "@/lib/api";

/** Pull-requests table. `action` adds a trailing column (e.g. "Review" for mentors). */
export function PRList({ prs, action }: { prs: MockPR[]; action?: "review" }) {
  if (prs.length === 0) return <EmptyState title="No pull requests" description="Nothing to show here yet." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pull request</TableHead>
          <TableHead>Repo</TableHead>
          <TableHead>Author</TableHead>
          <TableHead className="text-right">Δ</TableHead>
          <TableHead>State</TableHead>
          {action ? <TableHead className="text-right">Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {prs.map((pr) => {
          const reviewed = reviewForPR(pr.id);
          return (
            <TableRow key={pr.id}>
              <TableCell><Link href={`/github/pulls/${pr.id}`} className="font-medium hover:underline">#{pr.number} {pr.title}</Link></TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{ghRepo(pr.repoId)?.name}</TableCell>
              <TableCell className="text-muted-foreground">{personName(pr.authorId)}</TableCell>
              <TableCell className="text-right font-mono text-xs"><span className="text-success">+{pr.additions}</span> <span className="text-danger">−{pr.deletions}</span></TableCell>
              <TableCell><PRStateBadge state={pr.state} /></TableCell>
              {action ? (
                <TableCell className="text-right">
                  <Link href={`/github/pulls/${pr.id}`} className="text-xs font-medium text-primary hover:underline">
                    {pr.state === "open" ? "Review" : reviewed ? "View review" : "Open"}
                  </Link>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
