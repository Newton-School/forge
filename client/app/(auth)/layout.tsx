import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ForgeLogo } from "@/components/brand/forge-logo";

// Sign-in / access screens — keep out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const POINTS = [
  "Build on real GitHub repositories",
  "Mentor reviews and structured feedback",
  "Progress and learning, made measurable",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(150deg, #1e1b4b 0%, #4f46e5 56%, #312e81 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <ForgeLogo src="/forge_app_chip.png" size={40} className="size-10 rounded-xl ring-1 ring-white/20" />
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold">Forge</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">LCC · NST</span>
          </span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight">
            Build. Learn.
            <br />
            Contribute.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/75">
            The Profile Building Drive platform where students build on real repositories, mentors
            guide and review, and learning becomes measurable.
          </p>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">
          Built by the Learner Career Council · Newton School of Technology
        </p>
      </aside>

      {/* Auth content */}
      <main className="flex flex-col items-center justify-center bg-page px-4 py-12">
        {/* Compact brand for mobile (no side panel) */}
        <div className="mb-7 flex items-center gap-2.5 lg:hidden">
          <ForgeLogo src="/forge_app_chip.png" size={32} className="size-8 rounded-lg" />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Forge</span>
            <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
              LCC · NST
            </span>
          </span>
        </div>

        {children}

        <p className="mt-7 max-w-sm text-center text-xs text-subtle-foreground">
          Accounts are provisioned by administrators · No public signup
        </p>
      </main>
    </div>
  );
}
