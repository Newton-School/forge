import { Plus, Pencil, Mail } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_TEMPLATES } from "@/lib/mock/data";
import type { MockTemplate } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

function TemplateFields({ template }: { template?: MockTemplate }) {
  return (
    <>
      <Field label="Name">
        <Input placeholder="Weekly Update Reminder" defaultValue={template?.name} />
      </Field>
      <Field label="Subject">
        <Input placeholder="Your update is due today" defaultValue={template?.subject} />
      </Field>
      <Field label="Body">
        <Textarea rows={6} placeholder="Hi {{name}}, ..." />
      </Field>
      <Field label="Variables" hint="Comma-separated placeholders">
        <Input placeholder="{{ref}}, {{title}}" />
      </Field>
    </>
  );
}

const CONCERN_PREVIEW = `Hi {{lccName}},

A new concern has been raised and routed to LCC for triage.

Reference:  {{ref}}
Title:      {{title}}
Category:   {{category}}
Severity:   {{severity}}
Raised by:  {{raisedBy}} ({{raisedByRole}})
Domain:     {{domain}}
SLA due:    {{slaDue}}

{{description}}

Open the concern to acknowledge and assign an owner.

— PBDMP`;

export default function AdminEmailTemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Templates"
        description="Reusable, variable-driven templates for automated and bulk notifications."
        actions={
          <FormDialog
            trigger={
              <Button size="sm">
                <Plus />
                New template
              </Button>
            }
            title="New template"
            submitLabel="Create template"
          >
            <TemplateFields />
          </FormDialog>
        }
      />

      <SectionCard title="All templates" description={`${EMAIL_TEMPLATES.length} templates`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="pr-4 text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMAIL_TEMPLATES.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-4 font-medium text-foreground">{t.name}</TableCell>
                <TableCell>
                  <code className="font-mono text-xs text-muted-foreground">{t.subject}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.updatedBy}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{shortDate(t.updatedAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`}>
                        <Pencil />
                      </Button>
                    }
                    title="Edit template"
                    submitLabel="Save changes"
                  >
                    <TemplateFields template={t} />
                  </FormDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <Card>
        <CardHeader className="flex-row items-center gap-2.5 space-y-0">
          <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted text-foreground [&_svg]:size-4">
            <Mail />
          </span>
          <div>
            <CardTitle>Preview · Concern Raised → LCC</CardTitle>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">[Concern {"{{ref}}"}] {"{{title}}"}</p>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
            {CONCERN_PREVIEW}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
