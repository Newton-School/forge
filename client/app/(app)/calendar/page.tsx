import Link from "next/link";
import { CalendarClock, Flag, Megaphone, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { BrandIcon } from "@/components/integrations/brand-icon";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { BadgeTone } from "@/lib/labels";
import { CALENDAR } from "@/lib/api";

const TYPE: Record<string, { label: string; tone: BadgeTone }> = {
  REVIEW: { label: "Review", tone: "info" },
  MENTOR_MEETING: { label: "Mentor Meeting", tone: "primary" },
  DEADLINE: { label: "Deadline", tone: "danger" },
  MILESTONE: { label: "Milestone", tone: "warning" },
  EVENT: { label: "Event", tone: "success" },
};

const SCOPE: Record<string, { label: string; tone: BadgeTone }> = {
  DRIVE: { label: "Drive-wide", tone: "primary" },
  TEAM: { label: "Team", tone: "neutral" },
  PERSONAL: { label: "Personal", tone: "neutral" },
};

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" });
}

export default function CalendarPage() {
  const events = [...CALENDAR].sort((a, b) => (a.when + a.time).localeCompare(b.when + b.time));
  const driveCount = events.filter((e) => e.scope === "DRIVE").length;
  const reviewCount = events.filter((e) => e.type === "REVIEW" || e.type === "MENTOR_MEETING").length;
  const deadlineCount = events.filter((e) => e.type === "DEADLINE").length;

  // group by date
  const groups = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.when] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Your meetings, reviews and deadlines — plus every drive-wide event organized by LCC."
        actions={
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/connections"><BrandIcon name="calendar" size={14} /> Connect Google Calendar</Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Upcoming" value={events.length} sub="events on your calendar" icon={<CalendarClock />} />
        <StatCard label="Drive-wide (LCC)" value={driveCount} sub="visible to everyone" icon={<Megaphone />} />
        <StatCard label="Reviews & Meetings" value={reviewCount} icon={<Users />} />
        <StatCard label="Deadlines" value={deadlineCount} icon={<Flag />} />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide text-subtle-foreground">Legend</span>
        {Object.values(TYPE).map((t) => (
          <StatusBadge key={t.label} text={t.label} tone={t.tone} />
        ))}
        <span className="mx-1 text-border">·</span>
        <Badge tone="primary">LCC Drive-wide</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(groups).map(([day, items]) => (
          <SectionCard key={day} title={fmtDay(day)} bodyClassName="divide-y divide-border">
            {items.map((e) => {
              const t = TYPE[e.type] ?? { label: e.type, tone: "neutral" as BadgeTone };
              const s = SCOPE[e.scope];
              const isLcc = e.scope === "DRIVE";
              return (
                <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-16 shrink-0 text-sm font-medium tabular-nums text-foreground">{e.time}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">Organized by {e.organizer}</p>
                  </div>
                  <StatusBadge text={t.label} tone={t.tone} />
                  {isLcc ? (
                    <Badge tone="primary"><Megaphone className="size-3" /> Drive-wide</Badge>
                  ) : (
                    <StatusBadge text={s.label} tone={s.tone} />
                  )}
                </div>
              );
            })}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
