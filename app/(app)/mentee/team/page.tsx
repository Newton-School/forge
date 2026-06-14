import { GitBranch, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IdentityStrip } from "@/components/dashboard/identity-strip";
import { SectionCard } from "@/components/dashboard/section-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/lib/utils";

const MEMBERS = [
  { id: "tm1", name: "Sneha Iyer", role: "Mentee", you: true },
  { id: "tm2", name: "Kabir Singh", role: "Mentee" },
  { id: "tm3", name: "Ananya Joshi", role: "Mentee" },
  { id: "tm4", name: "Vivaan Patel", role: "Mentee" },
  { id: "tm5", name: "Aryan Sharma", role: "Mentor" },
];

export default function MenteeTeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Team" description="AI Group 07 — squad, members and group project." />

      <IdentityStrip
        items={[
          { label: "Domain", value: "Artificial Intelligence" },
          { label: "Team", value: "AI Group 07" },
          { label: "Squad", value: "Alpha" },
          { label: "Mentor", value: "Aryan Sharma" },
          { label: "Teacher", value: "Bipul Kumar" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Members" description={`${MEMBERS.length} in AI Group 07`} action={<Users className="size-4 text-muted-foreground" />} bodyClassName="p-4">
            <ul className="flex flex-col gap-2">
              {MEMBERS.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <Avatar><AvatarFallback>{initials(m.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name}{m.you ? <span className="ml-1.5 text-xs text-subtle-foreground">(you)</span> : null}
                    </p>
                  </div>
                  <Badge tone={m.role === "Mentor" ? "primary" : "neutral"}>{m.role}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Group Project" action={<GitBranch className="size-4 text-muted-foreground" />} bodyClassName="flex flex-col gap-3 p-4">
            <div>
              <p className="text-sm font-semibold">EngageIQ</p>
              <p className="text-xs text-muted-foreground">Real-time engagement scoring for live sessions.</p>
            </div>
            <p className="font-mono text-xs text-subtle-foreground">nst/engageiq-ai</p>
            <div className="flex items-center gap-2">
              <Progress value={78} className="flex-1" tone="primary" />
              <span className="text-xs tabular-nums text-muted-foreground">78%</span>
            </div>
          </SectionCard>

          <SectionCard title="Discord" action={<MessageSquare className="size-4 text-muted-foreground" />} bodyClassName="flex flex-col gap-2 p-4">
            <p className="font-mono text-sm text-foreground">#domain-aiml</p>
            <p className="text-xs text-muted-foreground">42 messages today · last activity 12 min ago. Mentor office hours: Tue & Thu, 5–6 PM.</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
