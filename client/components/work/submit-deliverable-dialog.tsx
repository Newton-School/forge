"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submit } from "@/lib/api";

/**
 * Mentee "Submit Deliverable" → POST /deliverables. Presentation-safe via `submit`.
 * The artifact is a link (artifactUrl); production also resolves project/type ids
 * from the API.
 */
export function SubmitDeliverableDialog() {
  const router = useRouter();

  async function send(data: FormData) {
    await submit("/deliverables", "POST", {
      projectId: String(data.get("projectId") ?? ""),
      typeId: (data.get("typeId") as string) || undefined,
      artifactUrl: String(data.get("artifactUrl") ?? ""),
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={
        <Button size="sm" className="gap-1.5">
          <Send className="size-3.5" /> Submit Deliverable
        </Button>
      }
      title="Submit Deliverable"
      submitLabel="Submit"
      onSubmit={send}
    >
      <Field label="Deliverable type" htmlFor="del-type">
        <Select name="typeId">
          <SelectTrigger id="del-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="source-code">Source Code</SelectItem>
            <SelectItem value="technical-report">Technical Report</SelectItem>
            <SelectItem value="presentation">Presentation</SelectItem>
            <SelectItem value="demo-video">Demo Video</SelectItem>
            <SelectItem value="data-pipeline">Data Pipeline</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Project" htmlFor="del-project">
        <Input id="del-project" name="projectId" placeholder="Project id" required />
      </Field>
      <Field label="Link" htmlFor="del-link" hint="Public URL to the artifact (repo, doc, video, deck)">
        <Input id="del-link" name="artifactUrl" type="url" placeholder="https://…" required />
      </Field>
    </FormDialog>
  );
}
