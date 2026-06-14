"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ALL_DOMAIN_KEYS, domainName } from "@/lib/domains";

/**
 * Multi-select domain filter, synced to the `?domain=AI,ML` URL param so server
 * components can read it. Pick all / one / several domains.
 *  - options : the domain keys available (e.g. a teacher's own domains).
 *  - If only one option is available, it renders as a static pill (no dropdown).
 */
export function DomainFilter({ options = ALL_DOMAIN_KEYS }: { options?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const selected = (sp.get("domain")?.split(",").filter(Boolean)) ?? [];

  function apply(vals: string[]) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    if (vals.length) params.set("domain", vals.join(",")); else params.delete("domain");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  function toggle(k: string) {
    const s = new Set(selected);
    s.has(k) ? s.delete(k) : s.add(k);
    apply([...s]);
  }

  // Single-domain context (e.g. a teacher with one domain) → static pill.
  if (options.length <= 1) {
    return <Badge tone="info">{options[0] ?? "All domains"}</Badge>;
  }

  const label =
    selected.length === 0 ? "All domains"
      : selected.length === 1 ? selected[0]
        : `${selected.length} domains`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-3.5" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Filter by domain</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((k) => (
            <DropdownMenuCheckboxItem
              key={k}
              checked={selected.includes(k)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggle(k)}
            >
              {domainName(k)}
            </DropdownMenuCheckboxItem>
          ))}
          {selected.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => apply([])}>Clear · all domains</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {selected.map((k) => (
        <Badge key={k} tone="info" className="gap-1">
          {k}
          <button type="button" onClick={() => toggle(k)} aria-label={`Remove ${k}`} className="-mr-0.5 ml-0.5 opacity-70 hover:opacity-100">
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
