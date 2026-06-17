import { GitMerge, GitPullRequest, GitPullRequestClosed, CircleDot, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** PR state → badge. merged (indigo) · open (green) · rejected (red). */
export function PRStateBadge({ state }: { state: "open" | "merged" | "rejected" }) {
  if (state === "merged") return <Badge tone="primary"><GitMerge className="size-3" /> Merged</Badge>;
  if (state === "rejected") return <Badge tone="danger"><GitPullRequestClosed className="size-3" /> Rejected</Badge>;
  return <Badge tone="success"><GitPullRequest className="size-3" /> Open</Badge>;
}

/** Issue state → badge. */
export function IssueStateBadge({ state }: { state: "open" | "closed" }) {
  return state === "open"
    ? <Badge tone="success"><CircleDot className="size-3" /> Open</Badge>
    : <Badge tone="neutral"><CircleCheck className="size-3" /> Closed</Badge>;
}

const scoreTone = (n: number) => (n >= 4 ? "bg-success" : n >= 3 ? "bg-warning" : "bg-danger");

/** A 1–5 learning-evaluation score as filled pips + label. */
export function ScorePips({ score, label }: { score: number; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span> : null}
      <span className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("size-2.5 rounded-full", n <= score ? scoreTone(score) : "bg-muted")} />
        ))}
      </span>
      <span className="text-xs font-medium tabular-nums text-foreground">{score}/5</span>
    </div>
  );
}
