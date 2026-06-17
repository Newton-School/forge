import { Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { shortDate } from "@/lib/utils";
import type { MockGhMilestone } from "@/lib/api";

/** A milestone with derived progress — milestones advance as PRs merge. */
export function MilestoneBar({ milestone }: { milestone: MockGhMilestone }) {
  const tone = milestone.progress >= 100 ? "success" : milestone.progress >= 60 ? "primary" : "warning";
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Flag className="size-3.5 text-muted-foreground" /> {milestone.title}
        </span>
        <Badge tone={milestone.state === "closed" ? "success" : "neutral"}>{milestone.state === "closed" ? "Done" : `Due ${shortDate(milestone.dueAt)}`}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={milestone.progress} tone={tone} className="flex-1" />
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{milestone.progress}%</span>
      </div>
    </div>
  );
}
