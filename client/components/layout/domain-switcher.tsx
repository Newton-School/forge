"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Boxes } from "lucide-react";
import type { DomainKey } from "@/lib/presentation";
import { DOMAIN_META, DOMAIN_KEYS } from "@/lib/presentation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/** DEV ONLY — Phase 1 preview switcher. Sets the domain cookie and refreshes. */
export function DomainSwitcher({ current }: { current: DomainKey }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function switchTo(domain: DomainKey) {
    document.cookie = `forge_domain=${domain}; path=/; max-age=31536000`;
    start(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={pending}>
          <Boxes className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Domain</span>
          <span className="font-medium">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Preview domain (dev only)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DOMAIN_KEYS.map((key) => {
          const m = DOMAIN_META[key];
          return (
            <DropdownMenuItem key={key} onClick={() => switchTo(key)} className="flex flex-col items-start gap-0.5 py-2">
              <span className="flex w-full items-center gap-2">
                <span className="font-medium">{key}</span>
                {m.githubDriven ? (
                  <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">GitHub-driven</span>
                ) : null}
                {key === current ? <Check className="ml-auto size-4 text-primary" /> : null}
              </span>
              <span className="text-[11px] text-muted-foreground">{m.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
