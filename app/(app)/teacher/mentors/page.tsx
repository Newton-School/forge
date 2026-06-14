import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { TEAMS } from "@/lib/mock/data";

type MentorRow = {
  mentor: string;
  team: string;
  domainKey: string;
  reviewCompletion: number;
  menteeSuccess: number;
  score: number;
  status: { text: string; tone: "success" | "warning" | "danger" };
};

const STATUS_BY_TONE = {
  success: { text: "Strong", tone: "success" as const },
  warning: { text: "Monitor", tone: "warning" as const },
  danger: { text: "Needs support", tone: "danger" as const },
};

// Deterministic mock metrics derived from team completion (Phase 1 visual only).
function deriveStatus(success: number): MentorRow["status"] {
  if (success >= 80) return STATUS_BY_TONE.success;
  if (success >= 60) return STATUS_BY_TONE.warning;
  return STATUS_BY_TONE.danger;
}

export default async function TeacherMentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  const myDomains = user.domainKeys ?? [];
  const sp = await searchParams;
  const picked = parseDomains(sp.domain);
  const active = picked.length ? picked.filter((d) => myDomains.includes(d)) : myDomains;

  const rows: MentorRow[] = TEAMS.filter((t) => active.includes(t.domainKey)).map((t) => {
    const reviewCompletion = Math.min(100, t.completion + 12);
    const menteeSuccess = t.completion;
    const score = Math.round((3 + (t.completion / 100) * 2) * 10) / 10;
    return {
      mentor: t.mentor,
      team: t.name,
      domainKey: t.domainKey,
      reviewCompletion,
      menteeSuccess,
      score,
      status: deriveStatus(menteeSuccess),
    };
  });

  const single = active.length === 1;
  const scope = single ? `the ${active[0]} domain` : active.join(", ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mentors"
        description={`${rows.length} mentors in ${scope} · review and 360° performance`}
        actions={<DomainFilter options={myDomains} />}
      />

      <SectionCard title="Mentor performance" description="Review completion, mentee success and 360° feedback">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentor</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="w-48">Review Completion</TableHead>
              <TableHead className="text-right">Mentee Success</TableHead>
              <TableHead className="text-right">360° Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.mentor}-${r.team}`}>
                <TableCell className="font-medium">{r.mentor}</TableCell>
                <TableCell><Badge tone="info">{r.domainKey}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{r.team}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={r.reviewCompletion}
                      tone={r.reviewCompletion >= 90 ? "success" : r.reviewCompletion >= 70 ? "primary" : "warning"}
                    />
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{r.reviewCompletion}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.menteeSuccess}%</TableCell>
                <TableCell className="text-right tabular-nums">{r.score.toFixed(1)}/5</TableCell>
                <TableCell><StatusBadge text={r.status.text} tone={r.status.tone} dot="●" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
