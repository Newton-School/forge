import { GitBranch } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GitBranch className="size-4.5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">PBDMP</p>
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
