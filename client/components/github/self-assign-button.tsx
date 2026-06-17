"use client";
import * as React from "react";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submit } from "@/lib/api";

/** Mentee "self-assign" on an issue → presentation-safe (no real write in demo mode). */
export function SelfAssignButton({ issueId }: { issueId: string }) {
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  async function assign() {
    setBusy(true);
    await submit(`/integrations/github/issues/${issueId}/self-assign`, "POST");
    setBusy(false);
    setDone(true);
  }
  if (done) return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="size-3.5" /> Assigned to you</span>;
  return (
    <Button size="sm" variant="outline" className="gap-1.5" disabled={busy} onClick={assign}>
      <UserPlus className="size-3.5" /> {busy ? "Assigning…" : "Self-assign"}
    </Button>
  );
}
