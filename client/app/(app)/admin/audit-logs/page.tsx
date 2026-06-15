"use client";

import { ScrollText, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_LOGS } from "@/lib/api";

const ACTORS = Array.from(new Set(AUDIT_LOGS.map((l) => l.actor)));
const ACTIONS = Array.from(new Set(AUDIT_LOGS.map((l) => l.action)));

export default function AdminAuditLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable — every privileged action recorded."
      />

      <SectionCard
        title="Activity log"
        description={`${AUDIT_LOGS.length} recent entries`}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ScrollText className="size-4 text-primary" />
            Append-only
          </span>
        }
        bodyClassName="px-0"
      >
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <Input placeholder="Search entity or IP…" className="pl-8" />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All actors" />
            </SelectTrigger>
            <SelectContent>
              {ACTORS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="pr-4">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AUDIT_LOGS.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="pl-4 whitespace-nowrap font-mono text-xs text-muted-foreground">{log.when}</TableCell>
                <TableCell className="font-medium text-foreground">{log.actor}</TableCell>
                <TableCell>
                  <Badge tone="neutral" className="font-mono">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.entity}</TableCell>
                <TableCell className="pr-4 font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
