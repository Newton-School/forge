"use client";

import { CircleCheckBig } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { submit } from "@/lib/api";

/**
 * Mentor/teacher deliverable verdict → POST /deliverables/:id/review.
 * Approve is a one-click confirm; Reject collects feedback. Presentation-safe.
 */
export function DeliverableReviewActions({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();

  async function review(decision: "APPROVED" | "REJECTED", feedback?: string) {
    await submit(`/deliverables/${deliverableId}/review`, "POST", { decision, feedback });
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <ConfirmDialog
        trigger={
          <Button size="sm" className="gap-1.5">
            <CircleCheckBig className="size-3.5" /> Approve
          </Button>
        }
        title="Approve deliverable?"
        confirmLabel="Approve"
        onConfirm={() => review("APPROVED")}
      />
      <FormDialog
        trigger={<Button size="sm" variant="outline">Reject</Button>}
        title="Reject deliverable"
        submitLabel="Reject"
        destructive
        onSubmit={(data) => review("REJECTED", (data.get("feedback") as string) || undefined)}
      >
        <Field label="Feedback to student" htmlFor="reject-feedback">
          <Textarea id="reject-feedback" name="feedback" rows={4} placeholder="Why is this being rejected? What should change?" />
        </Field>
      </FormDialog>
    </div>
  );
}
