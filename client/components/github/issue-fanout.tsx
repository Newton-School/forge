import Link from "next/link";
import { GitMerge } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRStateBadge } from "./gh-badges";
import { initials, cn } from "@/lib/utils";
import {
  prsForIssue, attemptsForIssue, ghPerson, personName, type MockPR,
} from "@/lib/api";

/**
 * One issue → many student PRs. Visualizes the multi-mentee reality:
 * who attempted, who raised a PR, which was merged, which were rejected and why.
 */
export function IssueFanout({ issueId }: { issueId: string }) {
  const prs = prsForIssue(issueId);
  const attempts = attemptsForIssue(issueId);
  const merged = prs.filter((p) => p.state === "merged").length;
  const rejected = prs.filter((p) => p.state === "rejected").length;
  // Students who picked up the issue but haven't raised a PR yet.
  const noPr = attempts.filter((a) => a.status === "attempting" && !prs.some((p) => p.authorId === a.studentId));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        <b className="text-foreground">{attempts.length}</b> attempted · <b className="text-foreground">{merged}</b> merged · <b className="text-foreground">{rejected}</b> rejected
      </p>
      <ul className="flex flex-col gap-2">
        {prs.map((pr) => <PrLine key={pr.id} pr={pr} />)}
        {noPr.map((a) => (
          <li key={a.studentId} className="flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2">
            <Person id={a.studentId} />
            <span className="text-sm text-muted-foreground">Working… <span className="text-subtle-foreground">(no PR yet)</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrLine({ pr }: { pr: MockPR }) {
  return (
    <li className={cn("flex flex-col gap-1 rounded-md border px-3 py-2", pr.state === "merged" ? "border-primary/30 bg-primary/5" : "border-border")}>
      <div className="flex flex-wrap items-center gap-2">
        <Person id={pr.authorId} />
        <Link href={`/github/pulls/${pr.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
          #{pr.number} {pr.title}
        </Link>
        {pr.state === "merged" ? <GitMerge className="size-3.5 text-primary" /> : null}
        <PRStateBadge state={pr.state} />
      </div>
      {pr.rejectionReason ? (
        <p className="pl-8 text-xs text-danger">Rejected: {pr.rejectionReason}</p>
      ) : null}
    </li>
  );
}

function Person({ id }: { id: string }) {
  const p = ghPerson(id);
  return (
    <span className="flex items-center gap-1.5">
      <Avatar className="size-6">
        <AvatarFallback style={{ background: p?.color, color: "white", fontSize: 10 }}>{initials(personName(id))}</AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium">{personName(id)}</span>
    </span>
  );
}
