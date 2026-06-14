import { Flag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { WorkBadge } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MILESTONES } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default function MenteeMilestonesPage() {
  const phases = [...new Set(MILESTONES.map((m) => m.phase))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Milestones" description="Phase progression for your individual and group projects." />

      {phases.map((phase) => {
        const items = MILESTONES.filter((m) => m.phase === phase).sort((a, b) => a.sequence - b.sequence);
        return (
          <SectionCard key={phase} title={phase} description={`${items.length} milestone${items.length === 1 ? "" : "s"}`} action={<Flag className="size-4 text-muted-foreground" />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Key Output</TableHead>
                  <TableHead className="w-44">Progress</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs tabular-nums text-subtle-foreground">{m.sequence}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">{m.keyOutput}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={m.completion} className="w-24" tone={m.completion === 100 ? "success" : "primary"} />
                        <span className="text-xs tabular-nums text-muted-foreground">{m.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{shortDate(m.due)}</TableCell>
                    <TableCell><WorkBadge v={m.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        );
      })}
    </div>
  );
}
