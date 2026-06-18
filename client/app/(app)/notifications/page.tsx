import { Bell } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { cn } from "@/lib/utils";
import { api, type MockNotification } from "@/lib/api";

const DOT: Record<string, string> = {
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
};

function NotificationRow({ n }: { n: MockNotification }) {
  return (
    <li className={cn("flex items-start gap-3 px-4 py-3", n.unread && "bg-muted/40")}>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[n.tone])} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{n.type}</p>
          {n.unread ? <span className="size-1.5 rounded-full bg-primary" /> : null}
        </div>
        <p className="text-sm text-muted-foreground">{n.text}</p>
      </div>
      <span className="shrink-0 text-xs text-subtle-foreground">{n.when}</span>
    </li>
  );
}

export default async function NotificationsPage() {
  const NOTIFICATIONS = await api.notifications();
  const unread = NOTIFICATIONS.filter((n) => n.unread);
  const earlier = NOTIFICATIONS.filter((n) => !n.unread);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={`${unread.length} unread`}
        actions={<MarkAllReadButton />}
      />

      {unread.length > 0 && (
        <SectionCard title="Unread" description={`${unread.length} new`} action={<Bell className="size-4 text-muted-foreground" />} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {unread.map((n) => <NotificationRow key={n.id} n={n} />)}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Earlier" description={`${earlier.length} notification${earlier.length === 1 ? "" : "s"}`} bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {earlier.map((n) => <NotificationRow key={n.id} n={n} />)}
        </ul>
      </SectionCard>
    </div>
  );
}
