import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/landing";
import { Reveal } from "./reveal";

export function Cta() {
  return (
    <section id="cta" className="px-6 py-24">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#2a2550] bg-[var(--mkt-ink)] px-6 py-20 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(124,108,245,0.35) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mkt-indigo-2)]">
              {BRAND.orgShort} · {BRAND.schoolShort}
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Join the ecosystem.
              <br />
              <span className="mkt-gradient-text">Build. Learn. Contribute.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/70">
              {BRAND.name} is invite-only and signed in with your {BRAND.schoolShort} Google account.
              Track growth through execution, one connected platform for the whole drive.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--mkt-ink)] transition-transform hover:-translate-y-0.5"
              >
                Sign in with Google
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#why"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore the platform
              </a>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Access is restricted to provisioned {BRAND.school} accounts.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
