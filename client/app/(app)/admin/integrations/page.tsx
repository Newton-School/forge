import { Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { BrandIcon } from "@/components/integrations/brand-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { TEAMS } from "@/lib/api";

interface Integration {
  key: "github" | "discord" | "calendar";
  name: string;
  lastSynced: string;
  tracked: string[];
  settings: { label: string; placeholder: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    key: "github",
    name: "GitHub",
    lastSynced: "2 min ago",
    tracked: ["Commits & PRs per team repo", "Code reviews & approvals", "Issue & milestone activity"],
    settings: [
      { label: "Organization", placeholder: "nst" },
      { label: "Default repo", placeholder: "org/repo" },
    ],
  },
  {
    key: "discord",
    name: "Discord",
    lastSynced: "8 min ago",
    tracked: ["Daily channel activity", "Mentor presence & responsiveness", "Concern & update threads"],
    settings: [
      { label: "Server ID", placeholder: "123456789012345678" },
      { label: "Channel", placeholder: "#updates" },
    ],
  },
  {
    key: "calendar",
    name: "Google Calendar",
    lastSynced: "1 hour ago",
    tracked: ["Weekly review slots", "Mentor 1:1 meetings", "Deadlines & hackathon events"],
    settings: [
      { label: "Calendar ID", placeholder: "drive@group.calendar.google.com" },
      { label: "Time zone", placeholder: "Asia/Kolkata" },
    ],
  },
];

export default function AdminIntegrationsPage() {
  const mapped = TEAMS.filter((t) => t.repo);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Connected services that feed activity signals into the drive."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {INTEGRATIONS.map((i) => {
          return (
            <Card key={i.key} className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-md border border-border bg-white">
                    <BrandIcon name={i.key} size={20} />
                  </span>
                  <CardTitle className="text-base">{i.name}</CardTitle>
                </div>
                <StatusBadge text="Connected" tone="success" dot="🟢" />
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Last synced <span className="font-medium text-foreground">{i.lastSynced}</span>
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {i.tracked.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="gap-2">
                <FormDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  }
                  title={`Manage ${i.name}`}
                  submitLabel="Save settings"
                >
                  {i.settings.map((s) => (
                    <Field key={s.label} label={s.label}>
                      <Input placeholder={s.placeholder} />
                    </Field>
                  ))}
                  <Field label="Webhook secret" hint="Used to verify inbound webhook payloads.">
                    <Input type="password" placeholder="••••••••" />
                  </Field>
                </FormDialog>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm">
                      Sync now
                    </Button>
                  }
                  title="Sync now?"
                  body={`Pull the latest activity from ${i.name}. This may take a moment.`}
                  confirmLabel="Sync"
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <SectionCard
        title="Mapped resources"
        description="Teams linked to external repositories and channels"
        bodyClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Team</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>GitHub repo</TableHead>
              <TableHead className="pr-4">Discord channel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mapped.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-4 font-medium text-foreground">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.domainKey}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{t.repo}</code>
                </TableCell>
                <TableCell className="pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    #{t.id.replace(/^t-/, "")}
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
