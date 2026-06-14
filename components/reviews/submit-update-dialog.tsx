"use client";

import * as React from "react";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Phase-1 mockup dialog for submitting a bi-daily L1 update.
 * Wraps FormDialog; the submit button just closes (no persistence).
 */
export function SubmitUpdateDialog({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <FormDialog
      trigger={trigger ?? <Button size="sm">Submit Update</Button>}
      title="Submit update (L1)"
      description="Every 2 days · ~2–3 min"
      submitLabel="Submit update"
    >
      <Field label="Worked on" htmlFor="su-worked">
        <Input id="su-worked" placeholder="e.g. Model evaluation metrics" />
      </Field>
      <Field label="Learning" htmlFor="su-learning">
        <Input id="su-learning" placeholder="e.g. Precision vs recall trade-off" />
      </Field>
      <Field label="Blocker" htmlFor="su-blocker" hint="leave blank if none">
        <Input id="su-blocker" placeholder="What's blocking you?" />
      </Field>
      <Field label="Next goal" htmlFor="su-next">
        <Input id="su-next" placeholder="What will you tackle next?" />
      </Field>
    </FormDialog>
  );
}
