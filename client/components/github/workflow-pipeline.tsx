import { CircleDot, UserPlus, GitBranch, Code2, GitPullRequest, ClipboardCheck, GitMerge, Flag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The canonical AI-Domain workflow, readable by a non-technical reviewer:
 * Issue → Self-Assign → Branch → Develop → Pull Request → Mentor Review → Merge → Milestone.
 * Pass `current` (0-based) to highlight progress up to a step.
 */
const STEPS = [
  { icon: CircleDot, label: "Issue", caption: "Unit of work" },
  { icon: UserPlus, label: "Self-Assign", caption: "Student picks it" },
  { icon: GitBranch, label: "Branch", caption: "Own branch" },
  { icon: Code2, label: "Develop", caption: "Commit work" },
  { icon: GitPullRequest, label: "Pull Request", caption: "Propose change" },
  { icon: ClipboardCheck, label: "Mentor Review", caption: "Code + learning" },
  { icon: GitMerge, label: "Merge", caption: "Best PR wins" },
  { icon: Flag, label: "Milestone", caption: "Progress moves" },
] as const;

export function WorkflowPipeline({ current = -1, className }: { current?: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-stretch gap-1.5", className)}>
      {STEPS.map((s, i) => {
        const done = current >= 0 && i <= current;
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex w-[104px] flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center",
                done ? "border-primary/40 bg-primary/5" : "border-border bg-background",
              )}
            >
              <span className={cn("flex size-7 items-center justify-center rounded-full [&_svg]:size-3.5",
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <Icon />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">{s.label}</span>
              <span className="text-[10px] leading-tight text-subtle-foreground">{s.caption}</span>
            </div>
            {i < STEPS.length - 1 ? <ChevronRight className="size-4 shrink-0 text-subtle-foreground" /> : null}
          </div>
        );
      })}
    </div>
  );
}
