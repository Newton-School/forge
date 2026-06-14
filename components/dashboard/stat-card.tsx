import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  delta?: { value: string; direction: "up" | "down"; good?: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, sub, delta, icon, className }: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {delta ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              delta.good ? "text-success" : "text-danger",
            )}
          >
            {delta.direction === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {delta.value}
          </span>
        ) : null}
      </div>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>{children}</div>;
}
