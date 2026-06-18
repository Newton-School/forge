import type { Metadata } from "next";
import { ForgeLogo } from "@/components/brand/forge-logo";

// Sign-in / access screens — keep out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4">
      <div className="mb-6 flex items-center gap-2">
        <ForgeLogo size={32} className="size-8" />
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Forge</p>
          <p className="text-[11px] text-subtle-foreground">Profile Building Drive</p>
        </div>
      </div>
      {children}
      <p className="mt-6 text-xs text-subtle-foreground">
        Accounts are provisioned by administrators · No public signup
      </p>
    </div>
  );
}
