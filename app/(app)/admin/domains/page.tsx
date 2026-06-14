import { Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DOMAINS, USERS } from "@/lib/mock/data";
import type { MockDomain } from "@/lib/mock/data";
import { parseDomains, inDomains } from "@/lib/domains";

function DomainFields({ domain }: { domain?: MockDomain }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input placeholder="Artificial Intelligence" defaultValue={domain?.name} />
        </Field>
        <Field label="Domain key">
          <Input placeholder="AI" defaultValue={domain?.key} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teacher">
          <Select defaultValue={domain?.teacher}>
            <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
            <SelectContent>
              {USERS.filter((u) => u.role === "TEACHER").map((u) => (
                <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Active">
          <Select defaultValue="yes">
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </>
  );
}

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const domains = DOMAINS.filter((d) => inDomains(d.key, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Domains"
        description="Top-level tracks that group teams, teachers and students."
        actions={
          <>
            <DomainFilter />
            <FormDialog
            trigger={
              <Button size="sm">
                <Plus />
                Add Domain
              </Button>
            }
            title="Add domain"
            submitLabel="Create domain"
          >
            <DomainFields />
          </FormDialog>
          </>
        }
      />

      <SectionCard title="All domains" description={`${domains.length} domains`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Domain</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Teams</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="w-48">Completion</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-4 font-medium text-foreground">{d.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{d.key}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.teacher}</TableCell>
                <TableCell className="text-right tabular-nums">{d.teams}</TableCell>
                <TableCell className="text-right tabular-nums">{d.students}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={d.completion} tone={d.completion >= 70 ? "success" : "primary"} className="w-28" />
                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{d.completion}%</span>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Edit ${d.name}`}>
                        <Pencil />
                      </Button>
                    }
                    title="Edit domain"
                    submitLabel="Save changes"
                  >
                    <DomainFields domain={d} />
                  </FormDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
