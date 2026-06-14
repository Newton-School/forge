import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number; tone?: "primary" | "success" | "warning" | "danger" }[];
  max?: number;
  suffix?: string;
  className?: string;
}

const TONE: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Lightweight horizontal bar chart (no chart lib) — enough for Phase 1 analytics. */
export function BarChart({ data, max, suffix = "%", className }: BarChartProps) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", TONE[d.tone ?? "primary"])}
              style={{ width: `${(d.value / peak) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums">
            {d.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
