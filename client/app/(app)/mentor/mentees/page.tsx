import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { L2Badge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MentorStatusDialog } from "@/components/reviews/mentor-status-dialog";
import { api } from "@/lib/api";
import { shortDate } from "@/lib/utils";

export default async function MenteesPage() {
  const MENTEES = await api.mentees();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="L2 — Mentee Dashboard"
        description="Mentor updates Status & Comment every 2 days"
      />

      <SectionCard
        title="All mentees"
        description="Bi-daily tracking across squads, blockers and update streaks"
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> {MENTEES.length} mentees
          </span>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentee</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Squad</TableHead>
              <TableHead className="text-right">Updates This Week</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="text-right">Blocker Streak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Days Since Update</TableHead>
              <TableHead>Action Needed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MENTEES.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.domainKey}</TableCell>
                <TableCell className="text-muted-foreground">{m.squad}</TableCell>
                <TableCell className="text-right tabular-nums">{m.updatesThisWeek}</TableCell>
                <TableCell className="text-muted-foreground">{shortDate(m.lastUpdate)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{m.blockerStreak}</TableCell>
                <TableCell>
                  <L2Badge v={m.statusL2} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{m.daysSinceUpdate}d</TableCell>
                <TableCell className="text-muted-foreground">{m.actionNeeded}</TableCell>
                <TableCell className="text-right">
                  <MentorStatusDialog menteeId={m.id} menteeName={m.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-subtle-foreground">Legend</span>
          <span>🟢 Doing Well</span>
          <span>🟡 Needs Consistency</span>
          <span>🔴 No Updates 4+ Days</span>
        </div>
      </SectionCard>
    </div>
  );
}
