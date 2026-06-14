"use client";

import { Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { L3Badge, L4Badge, FlagBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UPDATES, WEEKLY_REVIEWS } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default function MenteeReviewsPage() {
  const myUpdates = UPDATES.filter((u) => u.mentee === "Sneha Iyer");
  const myReviews = WEEKLY_REVIEWS.filter((w) => w.mentee === "Sneha Iyer");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reviews & Updates" description="Submit your bi-daily progress and track weekly faculty reviews." />

      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">Submit Update</TabsTrigger>
          <TabsTrigger value="my-updates">My Updates</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <SectionCard title="Bi-daily Update" description="Submit every 2 days · takes ~2–3 min" bodyClassName="p-5">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="workedOn">Worked On</Label>
                  <Input id="workedOn" placeholder="e.g. Model evaluation metrics" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="learning">Learning</Label>
                  <Input id="learning" placeholder="e.g. Precision vs recall trade-off" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="blocker">Blocker</Label>
                <Textarea id="blocker" placeholder="What's blocking you? Leave blank if none." className="min-h-16" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nextGoal">Next Goal</Label>
                <Textarea id="nextGoal" placeholder="What will you tackle next?" className="min-h-16" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-subtle-foreground">Updates feed your mentor&apos;s weekly review.</p>
                <ConfirmDialog
                  trigger={<Button size="sm" className="gap-1.5"><Send className="size-3.5" /> Submit Update</Button>}
                  title="Submit update?"
                  confirmLabel="Submit"
                />
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="my-updates">
          <SectionCard title="My Updates" description={`${myUpdates.length} submitted`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Worked On</TableHead>
                  <TableHead>Learning</TableHead>
                  <TableHead>Blocker</TableHead>
                  <TableHead>Next Goal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myUpdates.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{shortDate(u.date)}</TableCell>
                    <TableCell className="font-medium">{u.workedOn}</TableCell>
                    <TableCell className="text-muted-foreground">{u.learning}</TableCell>
                    <TableCell className={u.blocker === "—" ? "text-subtle-foreground" : "text-danger"}>{u.blocker}</TableCell>
                    <TableCell className="text-muted-foreground">{u.nextGoal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="flex flex-col gap-4">
            {myReviews.map((w) => (
              <SectionCard
                key={w.id}
                title={`Week ${w.week} Review`}
                description={`Mentor: ${w.mentor}`}
                action={<div className="flex items-center gap-2"><FlagBadge v={w.autoFlag} /><L3Badge v={w.mentorStatus} /></div>}
                bodyClassName="flex flex-col gap-4 p-5"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-subtle-foreground">Progress Summary</p>
                  <p className="text-sm text-foreground">{w.progressSummary}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-success-bg/40 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-success">Strength</p>
                    <p className="mt-1 text-sm text-foreground">{w.strength}</p>
                  </div>
                  <div className="rounded-md border border-border bg-warning-bg/40 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-warning">Improvement Area</p>
                    <p className="mt-1 text-sm text-foreground">{w.improvementArea}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-subtle-foreground">Teacher Decision</p>
                    <L4Badge v={w.teacherDecision} />
                  </div>
                  {w.teacherNotes ? <p className="text-sm text-muted-foreground">{w.teacherNotes}</p> : <p className="text-sm text-subtle-foreground">Awaiting teacher review.</p>}
                </div>
              </SectionCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
