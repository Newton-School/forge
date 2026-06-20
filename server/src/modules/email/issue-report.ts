import { emailShell, esc } from "./branding.js";

/**
 * Bug-report email sent to the Testing Admin when a tester files an issue.
 * Forge-branded, and escapes all tester-supplied text (title/description) so a
 * report can never inject HTML into the email.
 */
const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

const SEV_COLOR: Record<string, string> = {
  LOW: "#52525b",
  MEDIUM: "#d97706",
  HIGH: "#e11d48",
  CRITICAL: "#be123c",
};

export interface IssueEmailFields {
  title: string;
  description?: string | null;
  severity: string;
  domainKey: string;
  stepId?: string | null;
  reporterEmail: string;
}

export function buildIssueEmail(f: IssueEmailFields): { subject: string; html: string; text: string } {
  const color = SEV_COLOR[f.severity.toUpperCase()] ?? "#52525b";
  const subject = `[Forge Testing] ${f.severity} · ${f.domainKey} · ${f.title}`;

  const row = (label: string, value: string) =>
    `<tr>
      <td style="font-family:${FONT};font-size:12px;color:#a1a1aa;padding:5px 14px 5px 0;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="font-family:${FONT};font-size:13px;color:#18181b;padding:5px 0;">${value}</td>
    </tr>`;

  const html = emailShell(`
    <div style="margin-top:20px;display:inline-block;border-radius:999px;background:${color}1f;color:${color};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;">${esc(f.severity)} severity</div>
    <h1 style="font-family:${FONT};font-size:18px;font-weight:700;color:#18181b;margin:12px 0 4px;line-height:1.3;">${esc(f.title)}</h1>
    <p style="font-family:${FONT};font-size:12px;color:#71717a;margin:0 0 18px;">New issue reported from the Forge Testing Portal.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #e4e4e7;padding-top:8px;">
      ${row("Domain", esc(f.domainKey))}
      ${f.stepId ? row("Step", esc(f.stepId)) : ""}
      ${row("Reporter", esc(f.reporterEmail))}
    </table>
    ${
      f.description
        ? `<div style="margin-top:16px;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:12px 14px;font-family:${FONT};font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(f.description)}</div>`
        : ""
    }
  `);

  const text = [
    `[Forge Testing] ${f.severity} · ${f.domainKey}`,
    f.title,
    "",
    `Domain: ${f.domainKey}${f.stepId ? ` · Step: ${f.stepId}` : ""}`,
    `Reporter: ${f.reporterEmail}`,
    ...(f.description ? ["", f.description] : []),
  ].join("\n");

  return { subject, html, text };
}
