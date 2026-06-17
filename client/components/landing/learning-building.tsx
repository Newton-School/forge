import { Hammer, Bug, GitPullRequest, MessagesSquare, Sparkles } from "lucide-react";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const STEPS = [
  { icon: Hammer, verb: "Build", note: "Ship real features on real repositories." },
  { icon: Bug, verb: "Solve", note: "Pick up issues and own them end to end." },
  { icon: GitPullRequest, verb: "Raise PRs", note: "Open contributions for mentor review." },
  { icon: MessagesSquare, verb: "Explain", note: "Defend decisions in review discussions." },
  { icon: Sparkles, verb: "Learn", note: "Grow through execution — not just lectures." },
];

export function LearningBuilding() {
  return (
    <Section id="learning" className="relative overflow-hidden">
      <div aria-hidden className="mkt-aurora pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <Eyebrow>Learning by building</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <SectionHeading
              className="mt-5"
              title="Students don't just attend. They contribute."
              lead="The deepest learning in Forge doesn't come from a slide — it comes from shipping. Every student builds projects, solves issues, raises pull requests, and explains their work. Execution is the curriculum."
            />
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm leading-relaxed text-muted-foreground">
              By the end of a drive, a student doesn't have a grade to show — they have a{" "}
              <span className="font-semibold text-[var(--mkt-ink)]">contribution history</span>: merged
              pull requests, reviewed code, and a measurable record of what they built and learned.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="space-y-3">
          {STEPS.map((s) => (
            <RevealItem key={s.verb}>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-primary/40">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                    {s.verb}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.note}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}
