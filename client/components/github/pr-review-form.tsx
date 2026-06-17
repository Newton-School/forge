"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submit } from "@/lib/api";
import { cn } from "@/lib/utils";

const DIMENSIONS = [
  { key: "understanding", label: "Understanding" },
  { key: "explanation", label: "Explanation" },
  { key: "technicalDepth", label: "Technical depth" },
] as const;

const DECISIONS = [
  { key: "approved", label: "Approve & merge", tone: "bg-success text-white" },
  { key: "changes_requested", label: "Request changes", tone: "bg-warning text-white" },
  { key: "rejected", label: "Reject", tone: "bg-danger text-white" },
] as const;

/** Mentor learning-evaluation form — code decision + understanding scores. Presentation-safe. */
export function PrReviewForm({ prId }: { prId: string }) {
  const [scores, setScores] = React.useState<Record<string, number>>({ understanding: 4, explanation: 4, technicalDepth: 3 });
  const [decision, setDecision] = React.useState<string>("approved");
  const [notes, setNotes] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    await submit(`/integrations/github/pulls/${prId}/review`, "POST", { decision, ...scores, notes });
    setBusy(false);
    setDone(true);
  }

  if (done) return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-bg p-4 text-sm text-success">
      <Check className="size-4" /> Review recorded — evaluation saved to the student's history.
    </div>
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Record your review</p>
      {DIMENSIONS.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted-foreground">{d.label}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScores((s) => ({ ...s, [d.key]: n }))}
                className={cn("size-7 rounded-md border text-xs font-medium",
                  n <= scores[d.key]! ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDecision(d.key)}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition",
              decision === d.key ? d.tone : "border border-border text-muted-foreground hover:bg-muted")}
          >
            {d.label}
          </button>
        ))}
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What did they understand? What could they not explain? (stored historically)" />
      <Button size="sm" className="self-start" disabled={busy} onClick={save}>{busy ? "Saving…" : "Submit review"}</Button>
    </div>
  );
}
