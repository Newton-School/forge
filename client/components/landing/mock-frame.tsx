import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A lightweight browser/app window chrome to frame dashboard mockups. */
export function MockFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_40px_-12px_rgba(24,24,27,0.12)]", className)}>
      <div className="flex items-center gap-2 border-b border-border bg-[var(--page)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 truncate text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
