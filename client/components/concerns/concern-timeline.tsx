import { ConcernBadge } from "@/components/dashboard/status-badge";
import type { ConcernStatus } from "@/lib/types";

export interface TimelineEvent {
  status: ConcernStatus;
  actor: string;
  note?: string;
  at: string;
}

export function ConcernTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative ml-2 border-l border-border">
      {events.map((e, i) => (
        <li key={i} className="mb-5 ml-5 last:mb-0">
          <span className="absolute -left-[5px] mt-1 size-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <ConcernBadge v={e.status} />
            <span className="text-xs text-muted-foreground">{e.actor}</span>
            <span className="ml-auto text-xs text-subtle-foreground">{e.at}</span>
          </div>
          {e.note ? <p className="mt-1 text-sm text-foreground">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
