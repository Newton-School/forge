import { Activity, GitMerge, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import { Counter } from "./counter";
import { getPublicStats, type MetricKey } from "@/lib/public-stats";
import { timeAgo } from "@/lib/utils";

const METRICS: {
  key: MetricKey;
  icon: LucideIcon;
  suffix: string;
  label: string;
  hint: string;
}[] = [
  { key: "contributionsTracked", icon: Activity, suffix: "", label: "Contributions tracked", hint: "commits · PRs · reviews" },
  { key: "prsReviewedPct", icon: GitMerge, suffix: "%", label: "PRs reviewed", hint: "before merge" },
  { key: "milestonesOnTrackPct", icon: Target, suffix: "%", label: "Milestones on track", hint: "across all teams" },
  { key: "consistencyLiftPct", icon: TrendingUp, suffix: "%", label: "Consistency lift", hint: "since drive start" },
];

export async function Analytics() {
  // Real, public-safe aggregates from the server (read-only snapshot). Degrades to
  // a "Coming Soon" state per metric when the drive hasn't produced data yet.
  const stats = await getPublicStats();

  return (
    <Section id="analytics" className="bg-[var(--page)]">
      <Reveal>
        <Eyebrow>
          {stats.hasData ? (
            <>
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Live · analytics &amp; visibility
            </>
          ) : (
            "Analytics & visibility"
          )}
        </Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Nothing important stays invisible."
          lead="Team health, contribution metrics, milestone completion, and learning progress roll up automatically, so mentors and teachers act on signal, not hunches."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const value = stats.metrics[m.key];
          const ready = value !== null && value !== undefined;
          return (
            <RevealItem key={m.key}>
              <div className="mkt-card h-full p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </span>
                {ready ? (
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--mkt-ink)]">
                    <Counter value={value} suffix={m.suffix} />
                  </p>
                ) : (
                  <p className="mt-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
                      Coming soon
                    </span>
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-[var(--mkt-ink)]">{m.label}</p>
                <p className="text-xs text-subtle-foreground">{m.hint}</p>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal delay={0.1}>
        <p className="mt-6 text-center text-xs text-subtle-foreground">
          {stats.hasData && stats.updatedAt
            ? `Aggregated across the drive · updated ${timeAgo(stats.updatedAt)}`
            : "Live metrics will appear here as the drive gets underway."}
        </p>
      </Reveal>
    </Section>
  );
}
