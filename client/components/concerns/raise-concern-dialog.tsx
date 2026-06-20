"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OctagonAlert, Mail, Loader2 } from "lucide-react";
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
import { CONCERN_CATEGORIES, raiseConcern } from "@/lib/api";

/** Concern intake — creates a tracked ticket and emails the LCC (server-side). */
export function RaiseConcernDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("TECHNICAL_ISSUE");
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length >= 3 && description.trim().length >= 1 && !submitting;

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("TECHNICAL_ISSUE");
    setSeverity("MEDIUM");
    setError(null);
  }

  async function submit() {
    setError(null);
    if (title.trim().length < 3) return setError("Title must be at least 3 characters.");
    if (!description.trim()) return setError("Please add a description.");
    setSubmitting(true);
    try {
      await raiseConcern({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
      });
      setOpen(false);
      reset();
      router.refresh(); // surface the new ticket under Concerns
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the concern. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
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
            <Input
              id="ctitle"
              placeholder="Short summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
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
            <Textarea
              id="cdesc"
              rows={4}
              placeholder="What's happening? What have you tried?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
            />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            On submit: ticket created → email to LCC, CC Nipun Sir &amp; Kushagra Sir → SLA timer starts.
          </div>
          {error ? (
            <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Submit concern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
