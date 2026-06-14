"use client";

import { MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { shortDate, initials } from "@/lib/utils";

const FEEDBACK = [
  { id: "f1", from: "Aryan Sharma", text: "Strong work on the resume parser — your handling of edge cases shows real maturity. Push the showcase-ready version next.", at: "2026-06-13" },
  { id: "f2", from: "Aryan Sharma", text: "Your ROC-curve question in today's session was sharp. Reinforce the precision/recall trade-off before the next milestone.", at: "2026-06-11" },
  { id: "f3", from: "Aryan Sharma", text: "Great consistency on bi-daily updates this week. Keep blockers specific so I can unblock you faster.", at: "2026-06-09" },
];

const QUESTIONS = [
  { id: "q1", label: "Was your mentor available when you needed help?" },
  { id: "q2", label: "Was the feedback you received useful and actionable?" },
];

function YesNo() {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border">
      <button type="button" className="px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">Yes</button>
      <span className="w-px bg-border" />
      <button type="button" className="px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">No</button>
    </div>
  );
}

export default function MenteeFeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Feedback" description="Feedback from your mentor and your 360° mentor rating." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Mentor Feedback" description="Received from Aryan Sharma" action={<MessageSquare className="size-4 text-muted-foreground" />} bodyClassName="p-4">
            <ul className="flex flex-col gap-3">
              {FEEDBACK.map((f) => (
                <li key={f.id} className="flex gap-3 rounded-md border border-border p-3">
                  <Avatar><AvatarFallback>{initials(f.from)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{f.from}</p>
                      <span className="text-xs text-subtle-foreground">{shortDate(f.at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard title="Rate Your Mentor (360°)" description="Confidential · feeds mentor accountability" bodyClassName="flex flex-col gap-4 p-5">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col gap-2">
              <p className="text-sm text-foreground">{q.label}</p>
              <YesNo />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-foreground">Comments</p>
            <Textarea placeholder="Anything else you'd like to share about your mentorship?" className="min-h-20" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-subtle-foreground">Responses inform mentor reviews.</p>
            <ConfirmDialog
              trigger={<Button size="sm" className="gap-1.5"><Send className="size-3.5" /> Submit Rating</Button>}
              title="Submit mentor feedback?"
              confirmLabel="Submit feedback"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
