import { Card } from "@/components/ui/card";

interface Item {
  label: string;
  value: string;
}

export function IdentityStrip({ items }: { items: Item[] }) {
  return (
    <Card className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-subtle-foreground">{it.label}</p>
          <p className="mt-0.5 truncate text-sm font-medium">{it.value}</p>
        </div>
      ))}
    </Card>
  );
}
