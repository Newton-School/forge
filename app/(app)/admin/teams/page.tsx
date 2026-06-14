import { Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TEAMS, DOMAINS, USERS } from "@/lib/mock/data";
import type { MockTeam } from "@/lib/mock/data";
import { parseDomains, inDomains } from "@/lib/domains";

function TeamFields({ team }: { team?: MockTeam }) {
  return (
    <>
      <Field label="Name">
        <Input placeholder="AI Group 07" defaultValue={team?.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Domain">
          <Select defaultValue={team?.domainKey}>
            <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d.id} value={d.key}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Alias">
          <Select defaultValue={team?.alias}>
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
          <Select defaultValue={team?.mentor}>
            <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
            <SelectContent>
              {USERS.filter((u) => u.role === "MENTOR").map((u) => (
                <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Squad">
          <Select defaultValue={team?.squad}>
            <SelectTrigger><SelectValue placeholder="Select squad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Alpha">Alpha</SelectItem>
              <SelectItem value="Beta">Beta</SelectItem>
              <SelectItem value="Gamma">Gamma</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Members">
          <Input type="number" placeholder="5" defaultValue={team?.members} />
        </Field>
        <Field label="Repo">
          <Input placeholder="org/repo" defaultValue={team?.repo} />
        </Field>
      </div>
    </>
  );
}

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const teams = TEAMS.filter((t) => inDomains(t.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teams"
        description="Pods, groups and squads that students collaborate within."
        actions={
          <>
            <DomainFilter />
            <FormDialog
            trigger={
              <Button size="sm">
                <Plus />
                Add Team
              </Button>
            }
            title="Add team"
            submitLabel="Create team"
          >
            <TeamFields />
          </FormDialog>
          </>
        }
      />

      <SectionCard title="All teams" description={`${teams.length} teams`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Team</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Mentor (Team Lead)</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-4 font-medium text-foreground">{t.name}</TableCell>
                <TableCell>
                  <Badge tone="info">{t.domainKey}</Badge>
                </TableCell>
                <TableCell>
                  <Badge tone="neutral">{t.alias}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                <TableCell className="text-right tabular-nums">{t.members}</TableCell>
                <TableCell className="pr-4 text-right">
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`}>
                        <Pencil />
                      </Button>
                    }
                    title="Edit team"
                    submitLabel="Save changes"
                  >
                    <TeamFields team={t} />
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
