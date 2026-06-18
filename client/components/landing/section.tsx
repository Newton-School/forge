import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Semantic section wrapper: consistent vertical rhythm + max width. */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-20 px-6 py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/** Small uppercase kicker above a heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section heading + optional lead paragraph. */
export function SectionHeading({
  title,
  lead,
  align = "left",
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--mkt-ink)] sm:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
