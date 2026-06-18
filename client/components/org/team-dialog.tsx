"use client";

import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submit } from "@/lib/api";
import type { MockTeam, MockDomain, MockUser } from "@/lib/api";

const str = (d: FormData, k: string) => ((d.get(k) as string) ?? "").trim() || undefined;

/**
 * Admin team create/edit → POST/PATCH /org/teams. Presentation-safe via `submit`.
 * The domain + mentor option lists are supplied by the server page (presentational).
 */
export function TeamDialog({
  team,
  domains,
  mentors,
}: {
  team?: MockTeam;
  domains: MockDomain[];
  mentors: MockUser[];
}) {
  const router = useRouter();
  const editing = Boolean(team);

  async function save(data: FormData) {
    const domainKey = str(data, "domainKey");
    const mentorName = str(data, "mentor");
    const repo = str(data, "repo");
    const mentorId = mentorName ? mentors.find((u) => u.name === mentorName)?.id : undefined;
    const githubRepoUrl = repo && /^https?:\/\//.test(repo) ? repo : undefined;

    const common = { name: str(data, "name"), alias: str(data, "alias"), mentorId, githubRepoUrl };
    if (editing) {
      await submit(`/org/teams/${team!.id}`, "PATCH", common);
    } else {
      const domainId = domainKey ? domains.find((d) => d.key === domainKey)?.id : undefined;
      await submit("/org/teams", "POST", { domainId, ...common });
    }
    router.refresh();
  }

  return (
    <FormDialog
      trigger={
        editing ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${team!.name}`}><Pencil /></Button>
        ) : (
          <Button size="sm"><Plus /> Add Team</Button>
        )
      }
      title={editing ? "Edit team" : "Add team"}
      submitLabel={editing ? "Save changes" : "Create team"}
      onSubmit={save}
    >
      <Field label="Name">
        <Input name="name" placeholder="AI Group 07" defaultValue={team?.name} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Domain">
          <Select name="domainKey" defaultValue={team?.domainKey} disabled={editing}>
            <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
            <SelectContent>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.key}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Alias">
          <Select name="alias" defaultValue={team?.alias ?? "TEAM"}>
            <SelectTrigger><SelectValue placeholder="Select alias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POD">Pod</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="TEAM">Team</SelectItem>
              <SelectItem value="SQUAD">Squad</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mentor">
          <Select name="mentor" defaultValue={team?.mentor}>
            <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
            <SelectContent>
              {mentors.map((u) => (
                <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Repo" hint="full https URL">
          <Input name="repo" placeholder="https://github.com/org/repo" defaultValue={team?.repo} />
        </Field>
      </div>
    </FormDialog>
  );
}
