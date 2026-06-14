"use client";
import { useState } from "react";
import { OctagonAlert, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CONCERN_CATEGORIES } from "@/lib/mock/data";

/** Concern intake. Phase 1: form is presentational (no submit). The note explains
 *  the real routing (ticket + email to LCC, CC organizing team). */
export function RaiseConcernDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [severity, setSeverity] = useState("MEDIUM");
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <OctagonAlert className="size-3.5 text-danger" />
            Raise Concern
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Raise a concern</DialogTitle>
          <DialogDescription>
            Creates a tracked ticket and emails LCC (CC: organizing team). You can follow its lifecycle under Concerns.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ctitle">Title</Label>
            <Input id="ctitle" placeholder="Short summary of the issue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select defaultValue="TECHNICAL_ISSUE">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONCERN_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cdesc">Description</Label>
            <Textarea id="cdesc" rows={4} placeholder="What's happening? What have you tried?" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            On submit: ticket created → email to LCC, CC Nipun Sir &amp; Kushagra Sir → SLA timer starts.
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
          <DialogClose asChild><Button size="sm">Submit concern</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
