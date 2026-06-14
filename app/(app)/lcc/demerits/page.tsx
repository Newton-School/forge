import { ShieldAlert, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { DEMERITS, MENTEES } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default async function DemeritsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const demerits = DEMERITS.filter((d) => inDomains(d.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Demerits"
        description="Disciplinary points issued for missed obligations"
        actions={
          <div className="flex items-center gap-2">
          <DomainFilter />
          <FormDialog
            trigger={
              <Button size="sm">
                <ShieldAlert /> Issue demerit
              </Button>
            }
            title="Issue demerit"
            submitLabel="Issue demerit"
            destructive
          >
            <Field label="User" htmlFor="dem-user">
              <Select>
                <SelectTrigger id="dem-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {MENTEES.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reason" htmlFor="dem-reason">
              <Textarea id="dem-reason" placeholder="Why is this demerit being issued?" />
            </Field>
            <Field label="Points" htmlFor="dem-points">
              <Input id="dem-points" type="number" defaultValue={1} />
            </Field>
            <Field label="Escalate" htmlFor="dem-escalate">
              <Select>
                <SelectTrigger id="dem-escalate">
                  <SelectValue placeholder="No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormDialog>
          </div>
        }
      />

      <SectionCard title="Issued demerits" description={`${demerits.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead>Issued By</TableHead>
              <TableHead>Escalated</TableHead>
              <TableHead>When</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demerits.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.user}</TableCell>
                <TableCell><Badge tone="info">{d.domainKey}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{d.reason}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium tabular-nums text-danger">{d.points}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.issuedBy}</TableCell>
                <TableCell>
                  <Badge tone={d.escalated ? "danger" : "neutral"}>
                    {d.escalated ? "Escalated" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{shortDate(d.when)}</TableCell>
                <TableCell className="text-right">
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Edit demerit for ${d.user}`}>
                        <Pencil />
                      </Button>
                    }
                    title={`Edit demerit — ${d.user}`}
                    submitLabel="Save changes"
                  >
                    <Field label="User">
                      <Input defaultValue={d.user} disabled />
                    </Field>
                    <Field label="Reason">
                      <Textarea defaultValue={d.reason} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Points">
                        <Input type="number" defaultValue={d.points} />
                      </Field>
                      <Field label="Escalated">
                        <Select defaultValue={d.escalated ? "yes" : "no"}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes — escalate to organizing team</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
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
