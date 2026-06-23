"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, FlaskConical, LogOut, Search, Sparkles, User } from "lucide-react";
import type { AuthUser } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/labels";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleSwitcher } from "./role-switcher";
import { DomainSwitcher } from "./domain-switcher";
import type { DomainKey } from "@/lib/presentation";
import { RaiseConcernDialog } from "@/components/concerns/raise-concern-dialog";
import { NOTIFICATIONS } from "@/lib/api";
import { signOut } from "@/lib/auth-actions";

function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-sm">
      {parts.map((p, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const label = p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const last = i === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5 text-subtle-foreground" /> : null}
            {last ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="text-muted-foreground hover:text-foreground">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function TopNav({ user, domain, presentation = false }: { user: AuthUser; domain: DomainKey; presentation?: boolean }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-w-0 items-center gap-3">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {/* Search (visual) */}
        <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-subtle-foreground md:flex">
          <Search className="size-3.5" />
          <span className="w-36 truncate">Search…</span>
          <kbd className="rounded border border-border bg-background px-1 text-[10px]">⌘K</kbd>
        </div>

        {/* Presentation/demo affordances — only when APP_MODE=presentation */}
        {presentation ? (
          <span className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 sm:inline-flex"
            title="Demo mode — showing seeded mock data">
            <FlaskConical className="size-3" /> Presentation
          </span>
        ) : null}
        {/* Domain switcher — real feature for roles that span domains (Admin/LCC/Teacher); also shown
            for everyone in presentation so the demo can preview each domain. Drives the GitHub/domain
            dashboards via the forge_domain cookie. */}
        {presentation || ["ADMIN", "LCC", "TEACHER"].includes(user.role) ? (
          <DomainSwitcher current={domain} />
        ) : null}
        {/* Role switcher is demo-only (you can't change your real role in production). */}
        {presentation ? <RoleSwitcher current={user.role} /> : null}
        <RaiseConcernDialog />

        {/* AI assist */}
        <Button variant="ghost" size="icon" title="AI assist">
          <Sparkles className="size-4 text-primary" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" title="Notifications">
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-semibold text-white">
                  {unread}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-2 px-2 py-2 text-sm">
                <span className={`mt-1 size-1.5 shrink-0 rounded-full ${n.unread ? "bg-primary" : "bg-border"}`} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{n.type}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.text}</p>
                </div>
                <span className="ml-auto whitespace-nowrap text-[10px] text-subtle-foreground">{n.when}</span>
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="justify-center text-primary">View all</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted">
              <Avatar>
                <AvatarFallback style={{ background: user.avatarColor, color: "white" }}>
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-subtle-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/profile"><User className="size-4" />Profile</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Real sign-out: revokes the server session (prod) or clears demo cookies, then → /landing.
                Called from onSelect — a <form> nested in a DropdownMenuItem is unmounted on select
                before it can submit, so the action never ran (no logout reached the server). */}
            <DropdownMenuItem className="gap-2" onSelect={() => { void signOut(); }}>
              <LogOut className="size-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
