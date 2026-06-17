import { Upload, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { UserFields } from "@/components/onboarding/user-fields";
import { CreateUserButton } from "@/components/onboarding/create-user-button";
import type { BadgeTone } from "@/lib/labels";
import { ROLE_LABEL } from "@/lib/labels";
import type { RoleKey } from "@/lib/types";
import { USERS } from "@/lib/api";
import { parseDomains, inDomains } from "@/lib/domains";
import { initials, shortDate } from "@/lib/utils";

const STATUS: Record<string, { text: string; tone: BadgeTone }> = {
  ACTIVE: { text: "Active", tone: "success" },
  INVITED: { text: "Pending Invitation", tone: "warning" },
  SUSPENDED: { text: "Suspended", tone: "danger" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const users = USERS.filter((u) => inDomains(u.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Accounts are admin-provisioned — no public signup."
        actions={
          <>
            <DomainFilter />
            <FormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Upload />
                  Import CSV
                </Button>
              }
              title="Import users"
              submitLabel="Import"
            >
              <Field label="CSV file" hint="CSV columns: name,email,role,domain,team">
                <Input type="file" accept=".csv" />
              </Field>
            </FormDialog>
            <CreateUserButton />
          </>
        }
      />

      <SectionCard title="All users" description={`${users.length} accounts`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const status = STATUS[u.status];
              return (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge tone="neutral">{ROLE_LABEL[u.role as RoleKey] ?? u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.domainKey ? <Badge tone="info">{u.domainKey}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge text={status.text} tone={status.tone} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {u.lastActive ? shortDate(u.lastActive) : "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Edit ${u.name}`}>
                          <Pencil />
                        </Button>
                      }
                      title="Edit user"
                      submitLabel="Save changes"
                    >
                      <UserFields user={u} />
                    </FormDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
