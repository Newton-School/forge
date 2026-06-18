import { Monitor, Server, Database, Boxes, ArrowDown } from "lucide-react";
import { ARCHITECTURE } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const LAYER_ICON = [Monitor, Server, Database, Boxes];

export function Architecture() {
  return (
    <Section id="architecture" className="bg-[var(--page)]">
      <Reveal>
        <Eyebrow>Platform architecture</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="A clean spine: UI in front, intelligence behind."
          lead="The client only renders. Every decision, integration, and secret lives on the server, the central intelligence layer that connects GitHub, Discord, Calendar, Email, and AI."
        />
      </Reveal>

      <RevealGroup className="mx-auto mt-12 max-w-2xl space-y-3">
        {ARCHITECTURE.map((l, i) => {
          const Icon = LAYER_ICON[i];
          const last = i === ARCHITECTURE.length - 1;
          return (
            <RevealItem key={l.layer}>
              <div className="mkt-card flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                      {l.layer}
                    </p>
                    <p className="font-mono text-[11px] text-primary">{l.tech}</p>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{l.note}</p>
                </div>
              </div>
              {!last && (
                <div aria-hidden className="flex justify-center py-1 text-subtle-foreground">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
