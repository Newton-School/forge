import { Check, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABEL } from "@/lib/labels";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import type { RoleKey } from "@/lib/types";

const ROLES: RoleKey[] = ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"];

// Representative subset of the permission union, grouped by area.
const PERMISSIONS: string[] = [
  "user:create",
  "user:import",
  "role:assign",
  "domain:manage",
  "team:manage",
  "config:edit",
  "menteeUpdate:submit",
  "weeklyReview:l3Submit",
  "weeklyReview:l4Submit",
  "gate:decide",
  "task:assign",
  "deliverable:review",
  "concern:raise",
  "concern:resolve",
  "email:bulkSend",
  "emailTemplate:manage",
  "analytics:global",
  "auditLog:read",
  "integration:manage",
  "demerit:manage",
];

export default function AdminRolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="RBAC matrix — role × permission. Scope (which records) is enforced separately. See docs/security-rbac.md."
      />

      <SectionCard
        title="Permission matrix"
        description="A green check grants the action to that role"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {PERMISSIONS.length} permissions · {ROLES.length} roles
          </span>
        }
        bodyClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card pl-4">Permission</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center">
                  {ROLE_LABEL[r]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((perm) => (
              <TableRow key={perm}>
                <TableCell className="sticky left-0 z-10 bg-card pl-4">
                  <code className="font-mono text-xs text-foreground">{perm}</code>
                </TableCell>
                {ROLES.map((r) => {
                  const granted = ROLE_PERMISSIONS[r].includes(perm as never);
                  return (
                    <TableCell key={r} className="text-center">
                      {granted ? (
                        <Check className="mx-auto size-4 text-success" aria-label="granted" />
                      ) : (
                        <span className="text-subtle-foreground" aria-label="not granted">
                          —
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
