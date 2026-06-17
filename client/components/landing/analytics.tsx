import { Activity, GitMerge, Target, TrendingUp } from "lucide-react";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import { Counter } from "./counter";

const METRICS = [
  { icon: Activity, value: 1284, suffix: "", label: "Contributions tracked", hint: "commits · PRs · reviews" },
  { icon: GitMerge, value: 92, suffix: "%", label: "PRs reviewed", hint: "before merge" },
  { icon: Target, value: 64, suffix: "%", label: "Milestones on track", hint: "across all teams" },
  { icon: TrendingUp, value: 18, suffix: "%", label: "Consistency lift", hint: "since drive start" },
];

export function Analytics() {
  return (
    <Section id="analytics" className="bg-[var(--page)]">
      <Reveal>
        <Eyebrow>Analytics & visibility</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Nothing important stays invisible."
          lead="Team health, contribution metrics, milestone completion, and learning progress roll up automatically — so mentors and teachers act on signal, not hunches."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <RevealItem key={m.label}>
            <div className="mkt-card h-full p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--mkt-ink)]">
                <Counter value={m.value} suffix={m.suffix} />
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--mkt-ink)]">{m.label}</p>
              <p className="text-xs text-subtle-foreground">{m.hint}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
