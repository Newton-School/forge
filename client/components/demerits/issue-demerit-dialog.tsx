"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submit, MENTEES } from "@/lib/api";

/** Admin/LCC "Issue demerit" → POST /demerits. Presentation-safe via `submit`. */
export function IssueDemeritDialog() {
  const router = useRouter();

  async function issue(data: FormData) {
    await submit("/demerits", "POST", {
      userId: String(data.get("userId") ?? ""),
      reason: String(data.get("reason") ?? ""),
      points: Number(data.get("points") ?? 1),
      escalated: data.get("escalated") === "yes",
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={<Button size="sm"><ShieldAlert /> Issue demerit</Button>}
      title="Issue demerit"
      submitLabel="Issue demerit"
      destructive
      onSubmit={issue}
    >
      <Field label="User" htmlFor="dem-user">
        <Select name="userId">
          <SelectTrigger id="dem-user"><SelectValue placeholder="Select user" /></SelectTrigger>
          <SelectContent>
            {MENTEES.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Reason" htmlFor="dem-reason">
        <Textarea id="dem-reason" name="reason" placeholder="Why is this demerit being issued?" required />
      </Field>
      <Field label="Points" htmlFor="dem-points">
        <Input id="dem-points" name="points" type="number" min={1} max={100} defaultValue={1} />
      </Field>
      <Field label="Escalate" htmlFor="dem-escalate">
        <Select name="escalated" defaultValue="no">
          <SelectTrigger id="dem-escalate"><SelectValue placeholder="No" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="yes">Yes — escalate to organizing team</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </FormDialog>
  );
}
