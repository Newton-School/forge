"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { LIFECYCLE } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Lifecycle() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(trackRef, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();

  return (
    <Section id="lifecycle">
      <Reveal>
        <Eyebrow>The project lifecycle</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <SectionHeading
          className="mt-5"
          title="Every contribution travels the same path."
          lead="From an open issue to a merged milestone, work moves through a real engineering workflow, the same one used in industry. Each stage produces evidence of learning."
        />
      </Reveal>

      <div ref={trackRef} className="relative mt-16">
        {/* track */}
        <div
          aria-hidden
          className="absolute left-0 top-6 hidden h-0.5 w-full bg-border lg:block"
        />
        <motion.div
          aria-hidden
          className="absolute left-0 top-6 hidden h-0.5 origin-left bg-gradient-to-r from-primary to-[var(--mkt-indigo-2)] lg:block"
          style={{ width: "100%" }}
          initial={{ scaleX: 0 }}
          animate={inView || reduce ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.4, ease: EASE }}
        />

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-8 lg:gap-2">
          {LIFECYCLE.map((s, i) => (
            <motion.li
              key={s.stage}
              className="relative lg:text-center"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={
                inView
                  ? { opacity: 1, y: 0 }
                  : reduce
                    ? { opacity: 0 }
                    : { opacity: 0, y: 16 }
              }
              transition={{ duration: 0.5, ease: EASE, delay: 0.12 * i }}
            >
              <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-primary bg-white text-sm font-bold text-primary lg:mx-auto">
                  {i + 1}
                </div>
                <div className="lg:mt-1">
                  <p className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                    {s.stage}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.note}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
