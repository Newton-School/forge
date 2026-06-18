"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND, NAV_LINKS } from "@/lib/landing";
import { ForgeLogo } from "@/components/brand/forge-logo";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <nav
          className={cn(
            "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            scrolled ? "mkt-glass shadow-[0_1px_0_rgba(24,24,27,0.04)]" : "bg-transparent",
          )}
        >
          <Link href="#top" className="flex items-center gap-2.5">
            <ForgeLogo src="/logo.png" size={34} className="h-[34px] w-[34px] rounded-lg" priority />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-[var(--mkt-ink)]">
                {BRAND.name}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {BRAND.orgShort} · {BRAND.schoolShort}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-[var(--mkt-ink)]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <a
            href="#cta"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Join the drive
          </a>
        </nav>
      </div>
    </header>
  );
}
