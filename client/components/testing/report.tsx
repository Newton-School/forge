"use client";

/**
 * Testing Report — the persistent status/issues view. In production it reads the server
 * `/report` (survives teardown, visible across devices; Admin sees every tester, others their
 * own). In presentation mode there is no server, so it derives the same shape from the
 * localStorage store. Same rendering either way.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FlaskConical, OctagonAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BadgeTone } from "@/lib/labels";
import { DOMAIN_KEYS } from "@/lib/mock/testing";
import {
  TESTING_PRESENTATION, fetchReport,
  type TestingReport, type ReportStatus, type ReportSummaryRow, type ReportIssueRow,
} from "@/lib/api/testing";
import { useTesting, domainStatus } from "./store";
import { usePlans } from "./plans";

const STATUS_META: Record<ReportStatus, { label: string; tone: BadgeTone }> = {
  NOT_STARTED: { label: "Not Started", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
};

/** Severity tone — tolerant of both server (UPPER) and presentation (Title) casings. */
function sevTone(severity: string): BadgeTone {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") return "danger";
  if (s === "HIGH") return "warning";
  if (s === "LOW") return "neutral";
  return "info"; // MEDIUM
}

const TO_ENUM: Record<string, ReportStatus> = {
  not_started: "NOT_STARTED", in_progress: "IN_PROGRESS", completed: "COMPLETED",
};

export function TestingReport() {
  const { state, ready } = useTesting();
  const { plans } = usePlans();
  const [remote, setRemote] = React.useState<TestingReport | null>(null);
  const [loading, setLoading] = React.useState(!TESTING_PRESENTATION);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (TESTING_PRESENTATION) return;
    let alive = true;
    fetchReport()
      .then((r) => { if (!alive) return; if (!r.ok) setError(r.message ?? "Failed to load."); else setRemote(r.data ?? null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Presentation → derive the report from the local store; production → the fetched report.
  const report: TestingReport | null = React.useMemo(() => {
    if (!TESTING_PRESENTATION) return remote;
    const summary: ReportSummaryRow[] = DOMAIN_KEYS.map((d) => ({
      domainKey: d,
      status: TO_ENUM[domainStatus(state.domains[d], plans?.[d]?.steps.length ?? 0)],
      issues: state.domains[d].issues.length,
      updatedAt: null,
    }));
    const issues: ReportIssueRow[] = DOMAIN_KEYS.flatMap((d) =>
      state.domains[d].issues.map((i, n) => ({
        id: `${d}-${n}`, testerEmail: state.tester, domainKey: d, stepId: i.stepId,
        title: i.title, description: i.description, severity: i.severity, createdAt: i.at,
      })),
    );
    return { admin: true, summary, issues };
  }, [remote, state, plans]);

  const totalIssues = report?.issues.length ?? 0;
  const completed = report?.summary.filter((s) => s.status === "COMPLETED").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Testing Report"
        description="Per-domain status and reported issues — persisted server-side in production (survives teardown)."
        actions={<Button variant="outline" size="sm" asChild><Link href="/testing"><ArrowLeft /> Testing Portal</Link></Button>}
      />

      {TESTING_PRESENTATION ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          <FlaskConical className="size-3" /> Presentation mode · from local progress
        </span>
      ) : null}

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Loading report…</Card>
      ) : error ? (
        <Card className="border-danger/30 bg-danger-bg/30 p-6 text-sm text-danger">{error}</Card>
      ) : !report || (!ready && TESTING_PRESENTATION) ? (
        <Card className="p-6 text-sm text-muted-foreground">No testing activity recorded yet.</Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Domains completed" value={`${completed}/${report.summary.length}`} icon={<CheckCircle2 className="size-4 text-success" />} />
            <StatCard label="Issues reported" value={String(totalIssues)} icon={<OctagonAlert className="size-4 text-danger" />} />
            <StatCard label="Scope" value={report.admin ? "All testers" : "Your activity"} />
          </div>

          <SectionCard title="Domain status" description="Validation progress per domain" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-subtle-foreground">
                  <th className="px-4 py-2 font-medium">Domain</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((row) => (
                  <tr key={row.domainKey} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <Badge tone="info">{row.domainKey}</Badge>
                        <span className="text-muted-foreground">{plans?.[row.domainKey]?.name ?? ""}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone={STATUS_META[row.status].tone}>{STATUS_META[row.status].label}</Badge></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{row.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title={`Reported issues · ${totalIssues}`} description="Every issue raised during testing" bodyClassName="p-4">
            {report.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues reported.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {report.issues.map((iss) => (
                  <div key={iss.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={sevTone(iss.severity)}>{iss.severity}</Badge>
                      <Badge tone="info">{iss.domainKey}</Badge>
                      <span className="font-medium">{iss.title}</span>
                      {iss.stepId ? <span className="font-mono text-[11px] text-subtle-foreground">{iss.stepId}</span> : null}
                    </div>
                    {iss.description ? <p className="mt-1.5 text-sm text-muted-foreground">{iss.description}</p> : null}
                    <p className="mt-1.5 text-[11px] text-subtle-foreground">{iss.testerEmail} · {String(iss.createdAt).slice(0, 16).replace("T", " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
      </div>
      {icon}
    </Card>
  );
}
