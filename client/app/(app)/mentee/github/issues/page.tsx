import { getActiveDomain } from "@/lib/session";
import { MenteeIssues as RepoView } from "@/components/github/repo/views";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IssueStateBadge } from "@/components/github/gh-badges";
import { SelfAssignButton } from "@/components/github/self-assign-button";
import { DEMO, ghTeam, issuesForRepo, attemptsForIssue } from "@/lib/api";

const STATUS_LABEL: Record<string, { text: string; tone: "primary" | "success" | "danger" | "warning" }> = {
  attempting: { text: "Attempting", tone: "warning" },
  pr_raised: { text: "PR raised", tone: "primary" },
  merged: { text: "Merged ✓", tone: "success" },
  rejected: { text: "Rejected", tone: "danger" },
};

/** Mentee issue board — pick an open issue (self-assign) then raise a PR. */
export default async function MenteeIssues() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const team = ghTeam(DEMO.teamId)!;
  const issues = issuesForRepo(team.repoId);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description="Pick an open issue, branch, build, and raise a PR. Multiple students can attempt the same one." />
      <SectionCard title={`${team.name} issues`} description={`${issues.length} total`} bodyClassName="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Your status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((i) => {
              const mine = attemptsForIssue(i.id).find((a) => a.studentId === DEMO.menteeId);
              const s = mine ? STATUS_LABEL[mine.status] : null;
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link href={`/github/issues/${i.id}`} className="font-medium hover:underline">#{i.number} {i.title}</Link>
                    <div className="mt-0.5 flex flex-wrap gap-1">{i.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}</div>
                  </TableCell>
                  <TableCell><IssueStateBadge state={i.state} /></TableCell>
                  <TableCell>{s ? <Badge tone={s.tone}>{s.text}</Badge> : <span className="text-xs text-subtle-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    {i.state === "open" && !mine ? <SelfAssignButton issueId={i.id} /> : <Link href={`/github/issues/${i.id}`} className="text-xs font-medium text-primary hover:underline">View</Link>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
