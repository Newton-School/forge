import { GitCommitHorizontal, GitMerge, GitPullRequest, GitPullRequestClosed } from "lucide-react";
import { shortDate } from "@/lib/utils";
import { orgActivity, type GhActivityItem } from "@/lib/api";

const ICON = {
  commit: GitCommitHorizontal,
  pr_opened: GitPullRequest,
  pr_merged: GitMerge,
  pr_rejected: GitPullRequestClosed,
  review: GitPullRequest,
} as const;

const TONE: Record<GhActivityItem["kind"], string> = {
  commit: "text-muted-foreground",
  pr_opened: "text-success",
  pr_merged: "text-primary",
  pr_rejected: "text-danger",
  review: "text-muted-foreground",
};

/** Recent org activity (commits + PR events) — the live pulse of the domain. */
export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const items = orgActivity(limit);
  return (
    <ul className="divide-y divide-border">
      {items.map((it) => {
        const Icon = ICON[it.kind];
        return (
          <li key={it.id} className="flex items-start gap-2.5 px-4 py-2.5">
            <Icon className={`mt-0.5 size-4 shrink-0 ${TONE[it.kind]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm"><span className="font-medium">{it.who}</span> <span className="text-muted-foreground">{it.what}</span></p>
              <p className="text-[11px] text-subtle-foreground"><span className="font-mono">{it.repo}</span> · {shortDate(it.when)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
