import Link from "next/link";
import { CalendarClock, CircleCheckBig, Flag, GitBranch, MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IdentityStrip } from "@/components/dashboard/identity-strip";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkBadge } from "@/components/dashboard/status-badge";
import { SubmitUpdateDialog } from "@/components/reviews/submit-update-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MILESTONES, TASKS, CALENDAR, GITHUB_ACTIVITY, NOTIFICATIONS } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default function MenteeDashboard() {
  const myTasks = TASKS.filter((t) => t.assignee === "Sneha Iyer");
  const upcoming = CALENDAR.slice(0, 3);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Welcome back, Sneha"
        description="Your profile-building progress at a glance."
        actions={
          <SubmitUpdateDialog trigger={<Button size="sm" className="gap-1.5"><Send className="size-3.5" /> Submit Update</Button>} />
        }
      />

      <IdentityStrip
        items={[
          { label: "Domain", value: "Artificial Intelligence" },
          { label: "Team", value: "AI Group 07" },
          { label: "Squad", value: "Alpha" },
          { label: "Mentor", value: "Aryan Sharma" },
          { label: "Teacher", value: "Bipul Kumar" },
        ]}
      />

      <StatGrid>
        <StatCard label="Overall Progress" value="88%" delta={{ value: "6%", direction: "up", good: true }} icon={<Flag />} />
        <StatCard label="Tasks Done" value="7 / 9" sub="2 in progress" icon={<CircleCheckBig />} />
        <StatCard label="Update Streak" value="3" sub="bi-daily updates this week" icon={<Send />} />
        <StatCard label="GitHub Commits" value="31" delta={{ value: "8", direction: "up", good: true }} icon={<GitBranch />} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard
            title="Milestones"
            description="Phase progression for your project"
            action={<Link href="/mentee/milestones" className="text-xs text-primary hover:underline">View all</Link>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead className="w-40">Progress</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MILESTONES.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.phase}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={m.completion} className="w-24" tone={m.completion === 100 ? "success" : "primary"} />
                        <span className="text-xs tabular-nums text-muted-foreground">{m.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{shortDate(m.due)}</TableCell>
                    <TableCell><WorkBadge v={m.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard
            title="My Tasks"
            action={<Link href="/mentee/tasks" className="text-xs text-primary hover:underline">View all</Link>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-32">Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.project}</TableCell>
                    <TableCell><Progress value={t.progress} className="w-20" /></TableCell>
                    <TableCell><WorkBadge v={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Next Up" bodyClassName="p-4">
            <ul className="flex flex-col gap-3">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{shortDate(e.when)} · {e.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="GitHub Activity" action={<GitBranch className="size-4 text-muted-foreground" />} bodyClassName="p-4">
            <ul className="flex flex-col gap-2.5">
              {GITHUB_ACTIVITY.slice(0, 4).map((g) => (
                <li key={g.id} className="text-sm">
                  <span className="font-mono text-[11px] text-subtle-foreground">{g.type}</span>{" "}
                  <span className="text-foreground">{g.title}</span>
                  <p className="text-xs text-muted-foreground">{g.repo} · {shortDate(g.when)}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Recent Feedback" action={<MessageSquare className="size-4 text-muted-foreground" />} bodyClassName="p-4">
            <ul className="flex flex-col gap-3">
              {NOTIFICATIONS.filter((n) => n.type.includes("feedback")).concat(NOTIFICATIONS.slice(0, 1)).slice(0, 2).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="text-foreground">{n.text}</p>
                  <p className="text-xs text-subtle-foreground">{n.when}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
