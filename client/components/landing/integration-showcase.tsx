"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { BrandIcon } from "@/components/integrations/brand-icon";
import { INTEGRATIONS, type IntegrationKey } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/** Real brand logo in a white tile so it stays legible on both active and
 *  inactive tabs. */
function IntegrationIcon({ k, size = 16 }: { k: IntegrationKey; size?: number }) {
  const tile = size + 12;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md border border-border bg-white"
      style={{ width: tile, height: tile }}
    >
      <BrandIcon name={k} size={size} />
    </span>
  );
}

function Mock({ k }: { k: IntegrationKey }) {
  const rows: Record<IntegrationKey, [string, string][]> = {
    github: [
      ["PR #142 · vision-anomaly-detector", "Approved"],
      ["PR #138 · data-pipeline", "Changes requested"],
      ["12 commits · 3 reviews", "this week"],
    ],
    discord: [
      ["#ai-perceptron", "24 messages today"],
      ["#mentors", "Office hours 5 PM"],
      ["@announcements", "L3 reviews due Fri"],
    ],
    calendar: [
      ["Mentor sync · Perceptron", "Tue 4:00 PM"],
      ["Milestone 2 review", "Thu 11:00 AM"],
      ["Sprint checkpoint", "Sat 10:00 AM"],
    ],
    email: [
      ["Onboarding invitation", "Sent · opened"],
      ["Review due in 24h", "Scheduled"],
      ["Concern escalated to teacher", "Delivered"],
    ],
    groq: [
      ["PR summary", "Adds IoU threshold; tests pass"],
      ["Team signal", "Backprop trending at-risk"],
      ["Weekly insight", "Consistency up 18%"],
    ],
  };
  return (
    <div className="space-y-2.5">
      {rows[k].map(([a, b]) => (
        <div
          key={a}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5"
        >
          <span className="truncate text-xs font-medium text-[var(--mkt-ink)]">{a}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {b}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IntegrationShowcase() {
  const [active, setActive] = useState<IntegrationKey>("github");
  const reduce = useReducedMotion();
  const current = INTEGRATIONS.find((i) => i.key === active)!;

  return (
    <Section id="integrations">
      <Reveal>
        <Eyebrow>The connected learning ecosystem</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Five industry-grade systems, one intelligence layer."
          lead="Forge is the portal at the center. GitHub, Discord, Calendar, Email, and Groq AI each do one job exceptionally well — and the platform weaves them into a single, coherent experience."
        />
      </Reveal>

      {/* tabs */}
      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-wrap gap-2">
          {INTEGRATIONS.map((i) => {
            const on = i.key === active;
            return (
              <button
                key={i.key}
                onClick={() => setActive(i.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-4 text-sm font-semibold transition-colors",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-[var(--mkt-ink)]",
                )}
              >
                <IntegrationIcon k={i.key} />
                {i.name}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mkt-card p-7"
          >
            <div className="flex items-center gap-3">
              <IntegrationIcon k={current.key} size={22} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {current.role}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-[var(--mkt-ink)]">
                  {current.name}
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.blurb}</p>
            <ul className="mt-5 space-y-2">
              {current.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-[var(--mkt-ink)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${active}-mock`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-[var(--page)] p-5"
          >
            <p className="mb-3 text-xs font-medium text-muted-foreground">Live in {current.name}</p>
            <Mock k={active} />
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
