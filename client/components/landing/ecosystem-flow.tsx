import { GraduationCap, Users, UsersRound, FolderGit2, CircleDot, GitPullRequest, MessageSquareCode, TrendingUp } from "lucide-react";
import { ECOSYSTEM_FLOW } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const ICONS = [
  GraduationCap,
  Users,
  UsersRound,
  FolderGit2,
  CircleDot,
  GitPullRequest,
  MessageSquareCode,
  TrendingUp,
];

export function EcosystemFlow() {
  return (
    <Section id="ecosystem" className="bg-[var(--page)]">
      <Reveal>
        <Eyebrow>How the ecosystem works</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="One chain — from a teacher's intent to a student's growth."
          lead="Direction flows down; contribution and signal flow back up. Every link in the chain is a real system doing real work, not a status field someone updates by hand."
        />
      </Reveal>

      <RevealGroup className="mt-14">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
          {ECOSYSTEM_FLOW.map((node, i) => {
            const Icon = ICONS[i];
            const last = i === ECOSYSTEM_FLOW.length - 1;
            return (
              <RevealItem key={node.label} className="lg:flex-1">
                <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                  <div className="relative flex items-center lg:w-full lg:flex-col">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-white text-primary shadow-[0_1px_0_rgba(24,24,27,0.04)] lg:mx-auto">
                      <Icon className="h-5 w-5" />
                    </div>
                    {!last && (
                      <div
                        aria-hidden
                        className="ml-3 hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-border lg:block"
                      />
                    )}
                  </div>
                  <div className="lg:mt-3">
                    <p className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                      {node.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{node.note}</p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </div>
      </RevealGroup>
    </Section>
  );
}
