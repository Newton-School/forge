import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { FlagBadge, L3Badge } from "@/components/dashboard/status-badge";
import { WriteReviewDialog } from "@/components/reviews/write-review-dialog";
import { api } from "@/lib/api";

export default async function ReviewsPage() {
  const [WEEKLY_REVIEWS, MENTEES] = await Promise.all([api.weeklyReviews(), api.mentees()]);
  const menteeNames = MENTEES.map((m) => m.name);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="L3 — Weekly Review Queue"
        description="Mentor fills L3 every Saturday → handed to Teacher (L4) Sunday"
        actions={<WriteReviewDialog menteeOptions={menteeNames} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {WEEKLY_REVIEWS.map((r) => (
          <SectionCard
            key={r.id}
            title={r.mentee}
            description={`Week ${r.week} · ${r.domainKey} · Squad ${r.squad}`}
            action={
              <div className="flex items-center gap-2">
                <FlagBadge v={r.autoFlag} />
                <L3Badge v={r.mentorStatus} />
              </div>
            }
            bodyClassName="flex flex-col gap-4 p-4"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">Progress Summary</p>
              <p className="mt-1 text-sm text-foreground">{r.progressSummary}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-success-bg/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-success">Strength</p>
                <p className="mt-1 text-sm text-foreground">{r.strength}</p>
              </div>
              <div className="rounded-md border border-border bg-warning-bg/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-warning">Improvement Area</p>
                <p className="mt-1 text-sm text-foreground">{r.improvementArea}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ClipboardCheck className="size-3.5" />
                {r.teacherDecision ? "Reviewed — awaiting next cycle" : "Awaiting mentor write-up"}
              </span>
              <WriteReviewDialog
                mentee={r.mentee}
                week={r.week}
                autoFlag={r.autoFlag}
                progressSummary={r.progressSummary}
                strength={r.strength}
                improvementArea={r.improvementArea}
                mentorStatus={r.mentorStatus}
                submitted={Boolean(r.progressSummary)}
              />
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
