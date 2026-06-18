import { Check, GraduationCap, UserCog, UsersRound } from "lucide-react";
import { ROLES } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import { MockFrame } from "./mock-frame";

const ROLE_ICON = { Mentee: GraduationCap, Mentor: UserCog, Teacher: UsersRound } as const;

/** A tiny presentational dashboard mock per role, enough to read as "real". */
function RoleMock({ role }: { role: string }) {
  if (role === "Mentee") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-[var(--page)] px-3 py-2">
          <span className="text-xs font-medium text-[var(--mkt-ink)]">vision-anomaly-detector</span>
          <span className="rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-semibold text-info">In review</span>
        </div>
        <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] text-[var(--mkt-ink)]">#142</span> Add IoU
          threshold to detector
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full w-[72%] bg-primary" />
          </span>
          72%
        </div>
      </div>
    );
  }
  if (role === "Mentor") {
    return (
      <div className="space-y-2.5">
        {[
          ["Aarav S.", "Doing well", "success"],
          ["Diya P.", "Needs consistency", "warning"],
          ["Kabir N.", "No updates · 4d", "danger"],
        ].map(([name, status, tone]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="text-xs font-medium text-[var(--mkt-ink)]">{name}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: `var(--${tone}-bg)`,
                color: `var(--${tone})`,
              }}
            >
              {status}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {[
        ["Perceptron", 86],
        ["Backprop", 64],
        ["Gradient", 41],
      ].map(([team, val]) => (
        <div key={team as string} className="rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--mkt-ink)]">{team}</span>
            <span className="text-muted-foreground">{val}% milestones</span>
          </div>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full bg-primary" style={{ width: `${val}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function RoleExperiences() {
  return (
    <Section id="roles" className="bg-[var(--page)]">
      <Reveal>
        <Eyebrow>Built for every role</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="One platform, three points of view."
          lead="Mentees see what to build. Mentors lead and review. Teachers track every team. The same data, shaped to each role and enforced by server-side access control."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
        {ROLES.map((r) => {
          const Icon = ROLE_ICON[r.role as keyof typeof ROLE_ICON];
          return (
            <RevealItem key={r.role}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {r.role}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--mkt-ink)]">
                  {r.headline}
                </h3>
                <div className="mt-4">
                  <MockFrame title={`Forge · ${r.role}`}>
                    <RoleMock role={r.role} />
                  </MockFrame>
                </div>
                <ul className="mt-5 space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
