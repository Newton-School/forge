import Link from "next/link";
import { Users, Boxes, Network, Plug, Plus, Upload, Settings, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_LOGS } from "@/lib/mock/data";

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Administration"
        description="Manage accounts, domains, teams, RBAC, configuration and integrations for the Profile Building Drive."
      />

      <StatGrid>
        <StatCard label="Total Users" value={240} sub="across all roles" icon={<Users />} />
        <StatCard label="Domains" value={3} sub="AI · ML · SDSE" icon={<Boxes />} />
        <StatCard label="Teams" value={44} sub="pods, groups & squads" icon={<Network />} />
        <StatCard label="Active Integrations" value="3 / 3" sub="GitHub · Discord · Calendar" icon={<Plug />} />
      </StatGrid>

      <SectionCard
        title="Recent audit activity"
        description="Latest privileged actions across the platform"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/audit-logs">
              <ScrollText />
              View all
            </Link>
          </Button>
        }
        bodyClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="pr-4">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AUDIT_LOGS.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="pl-4 font-medium text-foreground">{log.actor}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{log.action}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.entity}</TableCell>
                <TableCell className="pr-4 whitespace-nowrap text-muted-foreground">{log.when}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Quick actions" description="Jump straight into common admin tasks" bodyClassName="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button asChild variant="outline" className="h-auto justify-start gap-2 py-3">
            <Link href="/admin/users">
              <Plus />
              Create User
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-2 py-3">
            <Link href="/admin/domains">
              <Boxes />
              Add Domain
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-2 py-3">
            <Link href="/admin/configuration">
              <Settings />
              Configure Drive
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-2 py-3">
            <Link href="/admin/integrations">
              <Plug />
              Manage Integrations
            </Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
