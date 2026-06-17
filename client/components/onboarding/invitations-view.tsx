"use client";
import { useState } from "react";
import { MailCheck, MailOpen, Send, Clock, CircleSlash, RotateCw, Ban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserButton } from "./create-user-button";
import type { BadgeTone } from "@/lib/labels";
import type { InvitationStatus, MockInvitation } from "@/lib/api";
import { submit } from "@/lib/api";
import { shortDate } from "@/lib/utils";

const STATUS: Record<InvitationStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  OPENED: { label: "Opened", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
  EXPIRED: { label: "Expired", tone: "danger" },
};

/** Invitation status board (Admin + LCC) — track, resend, revoke. Presentation-safe. */
export function InvitationsView({ invitations }: { invitations: MockInvitation[] }) {
  const [rows, setRows] = useState(invitations);
  const [busy, setBusy] = useState<string | null>(null);

  const count = (s: InvitationStatus) => rows.filter((r) => r.status === s).length;
  const pending = count("PENDING") + count("SENT") + count("OPENED");

  async function resend(inv: MockInvitation) {
    setBusy(inv.id);
    try {
      await submit(`/users/${inv.id}/resend-invite`, "POST");
      const today = new Date().toISOString().slice(0, 10);
      setRows((rs) => rs.map((r) => (r.id === inv.id ? { ...r, status: "SENT", sentAt: today, openedAt: undefined, acceptedAt: undefined } : r)));
    } finally {
      setBusy(null);
    }
  }
  async function revoke(inv: MockInvitation) {
    setBusy(inv.id);
    try {
      await submit(`/invitations/${inv.id}`, "DELETE");
      setRows((rs) => rs.map((r) => (r.id === inv.id ? { ...r, status: "EXPIRED" } : r)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invitations"
        description="Onboarding invitation status — invite-only, Google sign-in."
        actions={<CreateUserButton label="Invite user" />}
      />

      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Completed" value={count("COMPLETED")} sub="signed in" icon={<MailCheck />} />
        <StatCard label="Awaiting sign-in" value={pending} sub="sent · opened · pending" icon={<Send />} />
        <StatCard label="Opened" value={count("OPENED")} sub="not yet signed in" icon={<MailOpen />} />
        <StatCard label="Expired" value={count("EXPIRED")} sub="needs resend" icon={<CircleSlash />} />
      </StatGrid>

      <SectionCard title="All invitations" description={`${rows.length} invitations`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Invitee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((inv) => {
              const s = STATUS[inv.status];
              const done = inv.status === "COMPLETED";
              return (
                <TableRow key={inv.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium text-foreground">{inv.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{inv.email}</div>
                  </TableCell>
                  <TableCell><Badge tone="neutral">{inv.role}</Badge></TableCell>
                  <TableCell>{inv.domainKey ? <Badge tone="info">{inv.domainKey}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge tone={s.tone}>{s.label}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{inv.sentAt ? shortDate(inv.sentAt) : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{inv.openedAt ? shortDate(inv.openedAt) : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{inv.acceptedAt ? shortDate(inv.acceptedAt) : "—"}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline" size="sm" className="gap-1.5"
                        disabled={done || busy === inv.id}
                        onClick={() => resend(inv)}
                      >
                        {busy === inv.id ? <Clock className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
                        Resend
                      </Button>
                      <Button
                        variant="ghost" size="icon" aria-label={`Revoke invite for ${inv.name}`}
                        disabled={done || inv.status === "EXPIRED" || busy === inv.id}
                        onClick={() => revoke(inv)}
                      >
                        <Ban className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
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
