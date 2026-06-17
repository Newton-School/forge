import { ArrowRight } from "lucide-react";
import { PROBLEMS } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

export function Why() {
  return (
    <Section id="why">
      <Reveal>
        <Eyebrow>Why Forge exists</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Classrooms teach. Forge makes learning happen."
          lead="Traditional learning leaves the most important things invisible — who built what, who's stuck, and whether anyone actually grew. Forge turns each of those gaps into something you can see."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((p) => (
          <RevealItem key={p.problem}>
            <div className="mkt-card h-full p-6 transition-colors hover:border-primary/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                The old way
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--mkt-ink)] line-through decoration-danger/40 decoration-2">
                {p.problem}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
              <div className="my-4 flex items-center gap-2 text-primary">
                <ArrowRight className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">With Forge</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--mkt-ink)]">
                {p.solution}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
