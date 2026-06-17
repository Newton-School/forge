import { ArrowRight, GitBranch, Sparkles } from "lucide-react";
import { BRAND, HERO_STATS } from "@/lib/landing";
import { EcosystemCanvas } from "./ecosystem-canvas";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-36 sm:pt-44">
      {/* layered backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mkt-aurora absolute inset-0" />
        <div className="mkt-grid absolute inset-0" />
        <EcosystemCanvas className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Profile Building Drive · {BRAND.orgShort} · {BRAND.schoolShort}
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--mkt-ink)] sm:text-6xl">
            Where students <span className="mkt-gradient-text">build</span>, mentors{" "}
            <span className="mkt-gradient-text">guide</span>, and learning becomes{" "}
            <span className="mkt-gradient-text">measurable</span>.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {BRAND.name} is the Profile Building Drive platform from the {BRAND.org}. Real
            repositories, real pull requests, real review loops — one connected ecosystem where every
            contribution is tracked and every student's growth is visible.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Join the ecosystem
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#ecosystem"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-[var(--mkt-ink)] transition-colors hover:bg-muted"
            >
              <GitBranch className="h-4 w-4" />
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="bg-white px-4 py-5 text-center">
                <dt className="text-2xl font-semibold tracking-tight text-[var(--mkt-ink)]">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs font-medium text-[var(--mkt-ink)]">{s.label}</dd>
                <dd className="mt-0.5 text-[11px] text-subtle-foreground">{s.hint}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
