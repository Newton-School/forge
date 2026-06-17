"use client";
import { useMemo, useState } from "react";
import { Send, Plus, Check, X, Monitor, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TEST_EMAIL_RECIPIENTS, submit } from "@/lib/api";
import { renderOnboardingEmail, ONBOARDING_SUBJECT } from "@/lib/onboarding-email";

const SAMPLE = { fullName: "Aryan Sharma", role: "Mentor", domain: "AI", team: "AI · Team Alpha", portalUrl: "https://forge.nst.app" };

interface LogRow { at: string; recipients: number; subject: string; status: "Sent" | "Failed" }

export function EmailTester() {
  const [variant, setVariant] = useState<"test" | "prod">("test");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selected, setSelected] = useState<Set<string>>(new Set(TEST_EMAIL_RECIPIENTS));
  const [extra, setExtra] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ to: string; ok: boolean }[] | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const isTest = variant === "test";
  const html = useMemo(() => renderOnboardingEmail({ ...SAMPLE, test: isTest }), [isTest]);
  const allRecipients = useMemo(() => [...TEST_EMAIL_RECIPIENTS, ...extra], [extra]);
  const chosen = allRecipients.filter((e) => selected.has(e));

  function toggle(email: string) {
    setSelected((s) => { const n = new Set(s); n.has(email) ? n.delete(email) : n.add(email); return n; });
  }
  function addCustom() {
    const e = custom.trim().toLowerCase();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || allRecipients.includes(e)) return;
    setExtra((x) => [...x, e]);
    setSelected((s) => new Set(s).add(e));
    setCustom("");
  }
  async function send() {
    if (!chosen.length) return;
    setBusy(true); setResults(null);
    try {
      await submit("/email/test-onboarding", "POST", { recipients: chosen });
      const res = chosen.map((to) => ({ to, ok: true })); // presentation: resolves ok
      setResults(res);
      setLogs((l) => [{ at: new Date().toISOString().slice(0, 16).replace("T", " "), recipients: chosen.length, subject: ONBOARDING_SUBJECT.test, status: "Sent" }, ...l]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email testing"
        description="Preview and send the onboarding email to reviewers before rollout."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Preview */}
        <SectionCard
          title="Onboarding email"
          description="Exactly what recipients receive"
          action={
            <div className="flex items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                <button onClick={() => setVariant("prod")} className={`px-3 py-1.5 text-xs font-medium ${!isTest ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>Production</button>
                <button onClick={() => setVariant("test")} className={`px-3 py-1.5 text-xs font-medium ${isTest ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>[TEST]</button>
              </div>
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                <button onClick={() => setDevice("desktop")} aria-label="Desktop" className={`px-2.5 py-1.5 ${device === "desktop" ? "bg-muted" : "bg-card"}`}><Monitor className="size-3.5" /></button>
                <button onClick={() => setDevice("mobile")} aria-label="Mobile" className={`px-2.5 py-1.5 ${device === "mobile" ? "bg-muted" : "bg-card"}`}><Smartphone className="size-3.5" /></button>
              </div>
            </div>
          }
        >
          <div className="mb-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Subject:</span>{" "}
            <span className="font-mono">{isTest ? ONBOARDING_SUBJECT.test : ONBOARDING_SUBJECT.prod}</span>
          </div>
          <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-3">
            <iframe
              title="Email preview"
              srcDoc={html}
              className="rounded-md border-0 bg-white"
              style={{ width: device === "mobile" ? 375 : "100%", height: 620 }}
            />
          </div>
        </SectionCard>

        {/* Recipients + send */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Recipients" description={`${chosen.length} selected`}>
            <div className="flex flex-col gap-1.5">
              {allRecipients.map((email) => (
                <label key={email} className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40">
                  <input type="checkbox" checked={selected.has(email)} onChange={() => toggle(email)} className="size-4 accent-[var(--color-primary)]" />
                  <span className="truncate font-mono text-xs">{email}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="add another email…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} className="h-9" />
              <Button variant="outline" size="sm" onClick={addCustom}><Plus className="size-3.5" /></Button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Sends the <strong>[TEST]</strong> variant — subject is prefixed <code className="font-mono">[TEST]</code>.</p>
              <Button size="sm" disabled={busy || !chosen.length} onClick={send} className="gap-1.5">
                <Send className="size-3.5" /> {busy ? "Sending…" : `Send test (${chosen.length})`}
              </Button>
            </div>
          </SectionCard>

          {results && (
            <SectionCard title="Delivery" description={`${results.filter((r) => r.ok).length}/${results.length} sent`}>
              <div className="flex flex-col gap-1">
                {results.map((r) => (
                  <div key={r.to} className="flex items-center gap-2 text-sm">
                    {r.ok ? <Check className="size-3.5 text-success" /> : <X className="size-3.5 text-danger" />}
                    <span className="font-mono text-xs text-muted-foreground">{r.to}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard title="Email log" description="Recent test sends" bodyClassName="px-0">
        {logs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No test emails sent yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Time</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4 whitespace-nowrap font-mono text-xs text-muted-foreground">{l.at}</TableCell>
                  <TableCell className="font-mono text-xs">{l.subject}</TableCell>
                  <TableCell>{l.recipients}</TableCell>
                  <TableCell className="pr-4"><Badge tone="success">{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
