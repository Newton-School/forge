import { Badge } from "@/components/ui/badge";
import { ScorePips } from "./gh-badges";
import { shortDate } from "@/lib/utils";
import { personName, type MockReview } from "@/lib/api";

const DECISION: Record<MockReview["decision"], { text: string; tone: "success" | "warning" | "danger" }> = {
  approved: { text: "Approved", tone: "success" },
  changes_requested: { text: "Changes requested", tone: "warning" },
  rejected: { text: "Rejected", tone: "danger" },
};

/**
 * Mentor review = code decision + learning evaluation. Mentors don't only grade code;
 * they record whether the student can *explain* their work. Stored historically.
 */
export function ReviewEvalCard({ review, prTitle }: { review: MockReview; prTitle?: string }) {
  const d = DECISION[review.decision];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {prTitle ? <p className="truncate text-sm font-medium">{prTitle}</p> : null}
          <p className="text-xs text-muted-foreground">Reviewed by {personName(review.reviewerId)} · {shortDate(review.createdAt)}</p>
        </div>
        <Badge tone={d.tone}>{d.text}</Badge>
      </div>
      <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-3">
        <ScorePips label="Understanding" score={review.understanding} />
        <ScorePips label="Explanation" score={review.explanation} />
        <ScorePips label="Technical depth" score={review.technicalDepth} />
      </div>
      <p className="border-l-2 border-border pl-3 text-sm italic text-muted-foreground">“{review.notes}”</p>
    </div>
  );
}
