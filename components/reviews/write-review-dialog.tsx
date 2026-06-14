"use client";
import { useState } from "react";
import { MessageSquare, Plus, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FlagBadge } from "@/components/dashboard/status-badge";
import type { AutoFlag, MentorStatusL3 } from "@/lib/types";

interface WriteReviewDialogProps {
  /** Omit for a brand-new review — a mentee picker is shown instead. */
  mentee?: string;
  week?: number;
  autoFlag?: AutoFlag;
  progressSummary?: string;
  strength?: string;
  improvementArea?: string;
  mentorStatus?: MentorStatusL3;
  submitted?: boolean;
  /** Mentee options for a new review (the mentor's assigned mentees). */
  menteeOptions?: string[];
}

/** L3 Weekly Review write-up. Phase 1: presentational (no persistence) — the form
 *  opens, is fully fillable, and closes. Phase 3 wires Submit to a Server Action. */
export function WriteReviewDialog({
  mentee, week, autoFlag = "NONE", progressSummary, strength, improvementArea,
  mentorStatus, submitted, menteeOptions = [],
}: WriteReviewDialogProps) {
  const isNew = !mentee;
  const [status, setStatus] = useState<string>(mentorStatus ?? "ON_TRACK");
  const [picked, setPicked] = useState<string>(menteeOptions[0] ?? "");
  const [weekNo, setWeekNo] = useState<string>(String(week ?? 1));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {isNew ? (
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" /> New review
          </Button>
        ) : (
          <Button size="sm" variant={submitted ? "outline" : "default"} className="gap-1.5">
            <MessageSquare className="size-3.5" />
            {submitted ? "Edit review" : "Write review"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "New weekly review (L3)" : `Weekly review (L3) — ${mentee}`}
          </DialogTitle>
          <DialogDescription>
            Submitted Saturday, then handed to the Teacher for the L4 decision on Sunday.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isNew && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Mentee</Label>
                <Select value={picked} onValueChange={setPicked}>
                  <SelectTrigger><SelectValue placeholder="Select a mentee" /></SelectTrigger>
                  <SelectContent>
                    {menteeOptions.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Week</Label>
                <Select value={weekNo} onValueChange={setWeekNo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                      <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="ps">Progress summary</Label>
            <Textarea id="ps" rows={3} defaultValue={progressSummary}
              placeholder="What did this mentee accomplish this week?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="st">Strength</Label>
              <Textarea id="st" rows={3} defaultValue={strength} placeholder="What went well?" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="im">Improvement area</Label>
              <Textarea id="im" rows={3} defaultValue={improvementArea}
                placeholder="What should improve next week?" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Mentor status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_TRACK">On Track</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="NEEDS_DISCUSSION">Needs Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>System auto-flag</Label>
              <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/40 px-3">
                <FlagBadge v={autoFlag} />
                <span className="ml-2 text-xs text-subtle-foreground">auto-generated</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            AI assist can draft this summary from the mentee&apos;s L1 updates &amp; GitHub activity (Phase 3).
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
          <DialogClose asChild><Button size="sm">Submit review</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
