import { BRAND, NAV_LINKS } from "@/lib/landing";
import { ForgeLogo } from "@/components/brand/forge-logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <ForgeLogo size={32} className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
              {BRAND.name}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The Profile Building Drive platform where students build, mentors guide, teachers
            track, and learning becomes measurable.
          </p>
          <p className="mt-4 text-xs text-subtle-foreground">
            Built by the {BRAND.org} ({BRAND.orgShort}) at {BRAND.school} ({BRAND.schoolShort}).
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
            Explore
          </p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-[var(--mkt-ink)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
            Access
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Google sign-in (NST only)</li>
            <li>Invite-only onboarding</li>
            <li>AI · ML · SDSE · DVA domains</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-subtle-foreground sm:flex-row">
        <span>© {BRAND.school}. All rights reserved.</span>
        <span>{BRAND.name} · {BRAND.tagline}</span>
      </div>
    </footer>
  );
}
