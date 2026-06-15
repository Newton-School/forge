import { Users, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TEAMS, USERS } from "@/lib/api";
import { initials, shortDate } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/labels";
import type { BadgeTone } from "@/lib/labels";
import type { RoleKey } from "@/lib/types";

const TEAM = TEAMS.find((t) => t.id === "t-ai-07")!;

const STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: "success",
  INVITED: "info",
  SUSPENDED: "danger",
};

// A representative roster: the team lead plus mentees, padded to the team size.
const ROSTER = [
  ...USERS.filter((u) => u.team === TEAM.name),
  { id: "us-r1", name: "Karthik Menon", email: "karthik@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "ACTIVE" as const, lastActive: "2026-06-14" },
  { id: "us-r2", name: "Ishita Bose", email: "ishita@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "ACTIVE" as const, lastActive: "2026-06-13" },
  { id: "us-r3", name: "Devansh Patel", email: "devansh@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "ACTIVE" as const, lastActive: "2026-06-12" },
  { id: "us-r4", name: "Meera Joshi", email: "meera@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "INVITED" as const },
  { id: "us-r5", name: "Yusuf Khan", email: "yusuf@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "ACTIVE" as const, lastActive: "2026-06-11" },
  { id: "us-r6", name: "Tara Singh", email: "tara@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "SUSPENDED" as const, lastActive: "2026-06-06" },
  { id: "us-r7", name: "Nikhil Rao", email: "nikhil@nst.edu", role: "MENTEE", team: TEAM.name, squad: TEAM.squad, status: "ACTIVE" as const, lastActive: "2026-06-14" },
].slice(0, TEAM.members);

export default function TeamRoster() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team Roster"
        description={`${TEAM.name} · ${ROSTER.length} members`}
      />

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Mentor" value={TEAM.mentor} />
          <Meta label="Teacher" value={TEAM.teacher} />
          <Meta label="Squad" value={`${TEAM.squad} · ${TEAM.domainKey}`} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">Repository</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <GitBranch className="size-3.5 text-muted-foreground" />
              <span className="font-mono">{TEAM.repo}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Members</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROSTER.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar><AvatarFallback>{initials(u.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ROLE_LABEL[u.role as RoleKey] ?? u.role}
                </TableCell>
                <TableCell>
                  <StatusBadge text={u.status.charAt(0) + u.status.slice(1).toLowerCase()} tone={STATUS_TONE[u.status]} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.lastActive ? shortDate(u.lastActive) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
