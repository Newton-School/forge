"use client";

import { Mail, Paperclip, Send, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { FormDialog, ConfirmDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_TEMPLATES, DOMAINS, TEAMS } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

const ROLES = ["MENTEE", "MENTOR", "TEACHER", "ALL"];

const RECENT_SENDS = [
  { id: "rs1", subject: "Weekly Update Reminder", recipients: 142, status: "Sent" as const },
  { id: "rs2", subject: "Milestone 1 due in 3 days", recipients: 88, status: "Sent" as const },
  { id: "rs3", subject: "Internal Hackathon #1 — RSVP", recipients: 240, status: "Scheduled" as const },
];

export default function EmailCenterPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Center"
        description="Compose and target bulk communications across the drive"
        actions={
          <Badge tone="neutral">
            <Mail className="size-3" /> Sending wired in Phase 3 (Nodemailer)
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Compose" description="Draft a targeted message" className="lg:col-span-2" bodyClassName="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g. Your bi-daily update is due today" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Domain</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Team</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={10} className="min-h-48" placeholder="Write your message… Use {{name}} and {{ref}} for merge fields." />
          </div>

          <div className="flex items-center justify-between gap-2">
            <FormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Paperclip /> Add attachment
                </Button>
              }
              title="Add attachment"
              submitLabel="Attach"
            >
              <Field label="File" htmlFor="email-attachment">
                <Input id="email-attachment" type="file" />
              </Field>
            </FormDialog>
            <div className="flex items-center gap-2">
              <FormDialog
                trigger={
                  <Button variant="secondary">
                    <CalendarClock /> Schedule
                  </Button>
                }
                title="Schedule email"
                submitLabel="Schedule"
              >
                <Field label="Send at" htmlFor="email-send-at">
                  <Input id="email-send-at" type="datetime-local" />
                </Field>
              </FormDialog>
              <ConfirmDialog
                trigger={
                  <Button>
                    <Send /> Send now
                  </Button>
                }
                title="Send email?"
                description="This sends to all selected recipients."
                confirmLabel="Send"
              />
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Templates" description={`${EMAIL_TEMPLATES.length} saved`} bodyClassName="flex flex-col divide-y divide-border">
            {EMAIL_TEMPLATES.map((t) => (
              <button key={t.id} className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/60">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{t.subject}</span>
                <span className="text-xs text-subtle-foreground">{t.updatedBy} · {shortDate(t.updatedAt)}</span>
              </button>
            ))}
          </SectionCard>

          <SectionCard title="Recent sends" description="Last bulk emails" bodyClassName="flex flex-col divide-y divide-border">
            {RECENT_SENDS.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.subject}</p>
                  <p className="text-xs text-muted-foreground">{s.recipients} recipients</p>
                </div>
                <Badge tone={s.status === "Sent" ? "success" : "info"}>{s.status}</Badge>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
