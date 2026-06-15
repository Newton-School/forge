"use client";

import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submit, USERS } from "@/lib/api";
import type { MockDomain } from "@/lib/api";

const str = (d: FormData, k: string) => ((d.get(k) as string) ?? "").trim() || undefined;

/**
 * Admin domain create/edit → POST/PATCH /org/domains. Presentation-safe via `submit`.
 * Teacher assignment is a separate many-to-many endpoint in production.
 */
export function DomainDialog({ domain }: { domain?: MockDomain }) {
  const router = useRouter();
  const editing = Boolean(domain);

  async function save(data: FormData) {
    const body = {
      key: str(data, "key"),
      name: str(data, "name"),
      ...(editing ? { active: (data.get("active") as string) !== "no" } : {}),
    };
    await submit(editing ? `/org/domains/${domain!.id}` : "/org/domains", editing ? "PATCH" : "POST", body);
    router.refresh();
  }

  return (
    <FormDialog
      trigger={
        editing ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${domain!.name}`}><Pencil /></Button>
        ) : (
          <Button size="sm"><Plus /> Add Domain</Button>
        )
      }
      title={editing ? "Edit domain" : "Add domain"}
      submitLabel={editing ? "Save changes" : "Create domain"}
      onSubmit={save}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" placeholder="Artificial Intelligence" defaultValue={domain?.name} required />
        </Field>
        <Field label="Domain key">
          <Input name="key" placeholder="AI" defaultValue={domain?.key} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teacher" hint="assigned via the domain-teachers endpoint">
          <Select defaultValue={domain?.teacher}>
            <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
            <SelectContent>
              {USERS.filter((u) => u.role === "TEACHER").map((u) => (
                <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {editing ? (
          <Field label="Active">
            <Select name="active" defaultValue="yes">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </div>
    </FormDialog>
  );
}
