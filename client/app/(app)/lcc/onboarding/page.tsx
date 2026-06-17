import { Users, UserPlus, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { CreateUserButton } from "@/components/onboarding/create-user-button";
import { parseDomains, inDomains } from "@/lib/domains";
import { USERS } from "@/lib/api";
import { shortDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/labels";

const STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: "success",
  INVITED: "warning",
  SUSPENDED: "danger",
};

function discordHandle(u: (typeof USERS)[number]) {
  if (u.status === "INVITED") return null;
  return "@" + u.name.split(" ")[0].toLowerCase();
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const users = USERS.filter((u) => inDomains(u.domainKey, selected));

  const total = users.length;
  const active = users.filter((u) => u.status === "ACTIVE").length;
  const invited = users.filter((u) => u.status === "INVITED").length;
  const suspended = users.filter((u) => u.status === "SUSPENDED").length;
  const onboardedPct = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Onboarding"
        description="Account activation and Discord linking status"
        actions={<><DomainFilter /><CreateUserButton label="Invite user" /></>}
      />

      <StatGrid className="lg:grid-cols-3">
        <StatCard label="Onboarded" value={`${onboardedPct}%`} sub={`${active} of ${total} active`} icon={<Users />} />
        <StatCard label="Pending Invites" value={invited} sub="awaiting first login" icon={<UserPlus />} />
        <StatCard label="Suspended" value={suspended} sub="accounts disabled" icon={<ShieldAlert />} />
      </StatGrid>

      <SectionCard title="Accounts" description={`${total} users in the drive`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Discord</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const handle = discordHandle(u);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.domainKey ? (
                      <Badge tone="info">{u.domainKey}</Badge>
                    ) : (
                      <span className="text-xs text-subtle-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.role}</TableCell>
                  <TableCell>
                    {handle ? (
                      <span className="font-mono text-xs">{handle}</span>
                    ) : (
                      <span className="text-xs text-subtle-foreground">Not linked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {u.lastActive ? shortDate(u.lastActive) : "—"}
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
