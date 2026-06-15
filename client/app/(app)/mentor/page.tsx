import Link from "next/link";
import { Users, Send, OctagonAlert, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { L2Badge, L3Badge, FlagBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MENTEES, WEEKLY_REVIEWS } from "@/lib/api";

export default function MentorDashboard() {
  const needAttention = MENTEES.filter((m) => m.statusL2 !== "DOING_WELL");
  const updatesThisWeek = MENTEES.reduce((sum, m) => sum + m.updatesThisWeek, 0);
  const atRisk = needAttention.length;
  const pendingReviews = WEEKLY_REVIEWS.filter((r) => r.teacherDecision === null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mentor Dashboard"
        description="Aryan Sharma · AI Group 07 — your mentees, reviews and assignments."
      />

      <StatGrid>
        <StatCard label="Assigned Mentees" value={MENTEES.length} sub="across 4 teams" icon={<Users />} />
        <StatCard label="Updates This Week" value={updatesThisWeek} sub="bi-daily logs received" icon={<Send />} />
        <StatCard
          label="At-Risk"
          value={atRisk}
          sub="not in Doing Well"
          delta={{ value: `${atRisk}`, direction: "up", good: false }}
          icon={<OctagonAlert />}
        />
        <StatCard label="Reviews Due" value="Saturday" sub={`${pendingReviews.length} pending L3`} icon={<ClipboardCheck />} />
      </StatGrid>

      <SectionCard
        title="Mentees needing attention"
        description="Mentor updates Status & Comment every 2 days"
        action={
          <Link href="/mentor/mentees" className="text-xs text-primary hover:underline">
            View all mentees
          </Link>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentee</TableHead>
              <TableHead>Squad</TableHead>
              <TableHead>Days Since Update</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action Needed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {needAttention.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.squad}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{m.daysSinceUpdate}d</TableCell>
                <TableCell>
                  <L2Badge v={m.statusL2} />
                </TableCell>
                <TableCell className="text-muted-foreground">{m.actionNeeded}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title="This week's reviews"
        description="Pending L3 weekly reviews awaiting Teacher (L4) sign-off"
        action={
          <Link href="/mentor/reviews" className="text-xs text-primary hover:underline">
            Open review queue
          </Link>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentee</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Auto-Flag</TableHead>
              <TableHead>Mentor Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingReviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.mentee}</TableCell>
                <TableCell className="text-muted-foreground">Week {r.week}</TableCell>
                <TableCell>
                  <FlagBadge v={r.autoFlag} />
                </TableCell>
                <TableCell>
                  <L3Badge v={r.mentorStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
