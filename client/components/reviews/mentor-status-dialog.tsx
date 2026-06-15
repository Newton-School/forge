"use client";
import { useRouter } from "next/navigation";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { submit } from "@/lib/api";

/** L2 — a mentor records a mentee's status. POSTs to /api/reviews/mentor-status. */
export function MentorStatusDialog({ menteeId, menteeName }: { menteeId: string; menteeName: string }) {
  const router = useRouter();

  async function onSubmit(data: FormData) {
    await submit("/reviews/mentor-status", "POST", {
      menteeId,
      statusL2: String(data.get("statusL2") ?? "DOING_WELL"),
      comment: (data.get("comment") as string) || undefined,
      actionNeeded: (data.get("actionNeeded") as string) || undefined,
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={<Button variant="ghost" size="sm">Update status</Button>}
      title={`Update status (L2) — ${menteeName}`}
      submitLabel="Save status"
      onSubmit={onSubmit}
    >
      <Field label="Status">
        <Select name="statusL2" defaultValue="DOING_WELL">
          <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="DOING_WELL">Doing Well</SelectItem>
            <SelectItem value="NEEDS_CONSISTENCY">Needs Consistency</SelectItem>
            <SelectItem value="NO_UPDATES_4PLUS">No Updates 4+ Days</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Comment" htmlFor={`comment-${menteeId}`}>
        <Input id={`comment-${menteeId}`} name="comment" placeholder="Observation about this mentee" />
      </Field>
      <Field label="Action needed" htmlFor={`action-${menteeId}`}>
        <Input id={`action-${menteeId}`} name="actionNeeded" placeholder="Follow-up action, if any" />
      </Field>
    </FormDialog>
  );
}
