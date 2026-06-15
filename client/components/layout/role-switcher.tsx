"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, FlaskConical } from "lucide-react";
import type { RoleKey } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/labels";
import { ROLE_HOME } from "@/lib/nav/nav.config";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ROLES: RoleKey[] = ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"];

/** DEV ONLY — Phase 1 preview switcher. Sets the role cookie and navigates. */
export function RoleSwitcher({ current }: { current: RoleKey }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function switchTo(role: RoleKey) {
    document.cookie = `forge_role=${role}; path=/; max-age=31536000`;
    start(() => router.push(ROLE_HOME[role]));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={pending}>
          <FlaskConical className="size-3.5 text-amber-500" />
          <span className="hidden sm:inline">Viewing as</span>
          <span className="font-medium">{ROLE_LABEL[current]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Preview role (dev only)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((role) => (
          <DropdownMenuItem key={role} onClick={() => switchTo(role)}>
            <span className="flex-1">{ROLE_LABEL[role]}</span>
            {role === current ? <Check className="size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
