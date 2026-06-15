"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submit } from "@/lib/api";

/**
 * L1 — submit a bi-daily mentee update. POSTs to /api/reviews/updates (presentation-safe).
 */
export function SubmitUpdateDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();

  async function onSubmit(data: FormData) {
    await submit("/reviews/updates", "POST", {
      workedOn: String(data.get("workedOn") ?? ""),
      learning: String(data.get("learning") ?? ""),
      blocker: (data.get("blocker") as string) || null,
      nextGoal: String(data.get("nextGoal") ?? ""),
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={trigger ?? <Button size="sm">Submit Update</Button>}
      title="Submit update (L1)"
      description="Every 2 days · ~2–3 min"
      submitLabel="Submit update"
      onSubmit={onSubmit}
    >
      <Field label="Worked on" htmlFor="su-worked">
        <Input id="su-worked" name="workedOn" required placeholder="e.g. Model evaluation metrics" />
      </Field>
      <Field label="Learning" htmlFor="su-learning">
        <Input id="su-learning" name="learning" required placeholder="e.g. Precision vs recall trade-off" />
      </Field>
      <Field label="Blocker" htmlFor="su-blocker" hint="leave blank if none">
        <Input id="su-blocker" name="blocker" placeholder="What's blocking you?" />
      </Field>
      <Field label="Next goal" htmlFor="su-next">
        <Input id="su-next" name="nextGoal" required placeholder="What will you tackle next?" />
      </Field>
    </FormDialog>
  );
}
