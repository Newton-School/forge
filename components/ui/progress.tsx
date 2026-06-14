import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}

const TONE: Record<NonNullable<ProgressProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({ value, className, tone = "primary" }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", TONE[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}
