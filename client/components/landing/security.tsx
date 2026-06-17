import { ShieldCheck } from "lucide-react";
import { SECURITY } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

export function Security() {
  return (
    <Section id="security">
      <Reveal>
        <Eyebrow>Security & governance</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Trusted by design, enforced on the server."
          lead="Access is never a frontend suggestion. Identity, permissions, isolation, and auditing are enforced where it counts — in the backend, on every single request."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECURITY.map((s) => (
          <RevealItem key={s.title}>
            <div className="mkt-card flex h-full gap-3.5 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success-bg text-success">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
