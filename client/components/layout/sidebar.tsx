"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch } from "lucide-react";
import { NAV, SHARED_NAV } from "@/lib/nav/nav.config";
import { ROLE_LABEL } from "@/lib/labels";
import type { AuthUser } from "@/lib/types";
import { NavIcon } from "./icon";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const sections = NAV[user.role];

  const isActive = (href: string) =>
    pathname === href || (href !== `/${user.role.toLowerCase()}` && pathname.startsWith(href + "/")) || pathname === href;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GitBranch className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Forge</p>
          <p className="text-[10px] text-subtle-foreground">Profile Building Drive</p>
        </div>
      </div>

      {/* Role / context chip */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{ROLE_LABEL[user.role]}</p>
            <p className="truncate text-[10px] text-subtle-foreground">
              {user.domainId ? "Domain-scoped" : user.role === "MENTEE" ? "Self-scoped" : "Global"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section, i) => (
          <div key={i} className="mb-4">
            {section.label ? (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                {section.label}
              </p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn("size-4 shrink-0", active ? "text-primary" : "text-subtle-foreground")}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Shared section */}
        <div className="mb-2 border-t border-border pt-3">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            {SHARED_NAV.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {SHARED_NAV.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <NavIcon name={item.icon} className={cn("size-4 shrink-0", active ? "text-primary" : "text-subtle-foreground")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
