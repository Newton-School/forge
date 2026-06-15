"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submit } from "@/lib/api";

/** Admin/LCC per-row "Edit demerit" → PATCH /demerits/:id. Presentation-safe. */
export function EditDemeritDialog({
  id, user, reason, points, escalated,
}: {
  id: string;
  user: string;
  reason: string;
  points: number;
  escalated: boolean;
}) {
  const router = useRouter();

  async function save(data: FormData) {
    await submit(`/demerits/${id}`, "PATCH", {
      reason: String(data.get("reason") ?? reason),
      points: Number(data.get("points") ?? points),
      escalated: data.get("escalated") === "yes",
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Edit demerit for ${user}`}>
          <Pencil />
        </Button>
      }
      title={`Edit demerit — ${user}`}
      submitLabel="Save changes"
      onSubmit={save}
    >
      <Field label="User">
        <Input defaultValue={user} disabled />
      </Field>
      <Field label="Reason">
        <Textarea name="reason" defaultValue={reason} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Points">
          <Input name="points" type="number" min={1} max={100} defaultValue={points} />
        </Field>
        <Field label="Escalated">
          <Select name="escalated" defaultValue={escalated ? "yes" : "no"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes — escalate to organizing team</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </FormDialog>
  );
}
