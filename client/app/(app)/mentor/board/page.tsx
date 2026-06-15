import { CircleDot, GitPullRequest } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TASKS, GITHUB_ACTIVITY, TEAMS } from "@/lib/api";
import { initials, cn } from "@/lib/utils";
import type { WorkStatus } from "@/lib/types";

const TEAM = TEAMS.find((t) => t.id === "t-ai-07")!;

interface BoardCard {
  id: string;
  title: string;
  meta: string;
  assignee?: string;
  kind: "task" | "issue" | "pr";
}

const COLUMNS: { key: string; label: string; statuses: WorkStatus[] }[] = [
  { key: "backlog", label: "Backlog", statuses: ["TODO"] },
  { key: "progress", label: "In Progress", statuses: ["IN_PROGRESS"] },
  { key: "review", label: "In Review", statuses: ["IN_REVIEW"] },
  { key: "done", label: "Done", statuses: ["DONE"] },
  { key: "released", label: "Released", statuses: ["RELEASED"] },
];

function cardsFor(statuses: WorkStatus[], extra: BoardCard[] = []): BoardCard[] {
  const tasks: BoardCard[] = TASKS.filter((t) => statuses.includes(t.status)).map((t) => ({
    id: t.id,
    title: t.title,
    meta: t.project,
    assignee: t.assignee,
    kind: "task",
  }));
  return [...tasks, ...extra];
}

// Open GitHub issues / PRs surfaced onto the board.
const ghBacklog: BoardCard[] = GITHUB_ACTIVITY
  .filter((g) => g.type === "ISSUE" && g.state === "open")
  .map((g) => ({ id: g.id, title: g.title, meta: g.repo, assignee: g.author, kind: "issue" }));

const ghReview: BoardCard[] = GITHUB_ACTIVITY
  .filter((g) => g.type === "PR" && g.state === "open")
  .map((g) => ({ id: g.id, title: g.title, meta: g.repo, assignee: g.author, kind: "pr" }));

const COLUMN_CARDS: Record<string, BoardCard[]> = {
  backlog: cardsFor(["TODO"], ghBacklog),
  progress: cardsFor(["IN_PROGRESS"]),
  review: cardsFor(["IN_REVIEW"], ghReview),
  done: cardsFor(["DONE"]),
  released: cardsFor(["RELEASED"]),
};

const KIND_BADGE: Record<BoardCard["kind"], { label: string; tone: "neutral" | "info" | "primary" }> = {
  task: { label: "Task", tone: "neutral" },
  issue: { label: "Issue", tone: "info" },
  pr: { label: "PR", tone: "primary" },
};

export default function TeamBoard() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sprint Board"
        description={`${TEAM.name} · ${TEAM.repo}`}
      />

      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const cards = COLUMN_CARDS[col.key] ?? [];
          return (
            <div key={col.key} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">{col.label}</h2>
                <span className="flex size-5 items-center justify-center rounded-full bg-background text-[11px] font-medium tabular-nums text-muted-foreground">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-2 pb-2">
                {cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">No cards</p>
                ) : (
                  cards.map((c) => {
                    const kb = KIND_BADGE[c.kind];
                    return (
                      <div key={`${col.key}-${c.id}`} className="rounded-md border border-border bg-card p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Badge tone={kb.tone} className="gap-1 text-[10px] uppercase">
                            {c.kind === "issue" ? <CircleDot className="size-3" /> : null}
                            {c.kind === "pr" ? <GitPullRequest className="size-3" /> : null}
                            {kb.label}
                          </Badge>
                          {c.assignee ? (
                            <Avatar className={cn("size-6")}>
                              <AvatarFallback className="text-[10px]">{initials(c.assignee)}</AvatarFallback>
                            </Avatar>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium leading-snug">{c.title}</p>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{c.meta}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
