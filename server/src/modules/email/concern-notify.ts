import { emailShell, esc } from "./branding.js";

/**
 * Concern notification email sent to the LCC (CC: organizing team) when a concern
 * is raised. Forge-branded; all user-supplied text is escaped.
 */
const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

const SEV_COLOR: Record<string, string> = {
  LOW: "#52525b",
  MEDIUM: "#d97706",
  HIGH: "#e11d48",
  CRITICAL: "#be123c",
};

const CATEGORY_LABEL: Record<string, string> = {
  MENTOR: "Mentor",
  MENTEE: "Mentee",
  TEACHER: "Teacher",
  TEAM_MEMBER: "Team member",
  DOMAIN_ISSUE: "Domain issue",
  TECHNICAL_ISSUE: "Technical issue",
  PROCESS_ISSUE: "Process issue",
  OTHER: "Other",
};

export interface ConcernEmailFields {
  title: string;
  description: string;
  category: string;
  severity: string;
  raisedBy: string; // display name, or "Anonymous"
  raisedByEmail?: string | null;
  concernUrl?: string | null;
}

export function buildConcernEmail(f: ConcernEmailFields): { subject: string; html: string; text: string } {
  const color = SEV_COLOR[f.severity.toUpperCase()] ?? "#52525b";
  const cat = CATEGORY_LABEL[f.category] ?? f.category;
  const subject = `[Forge Concern] ${f.severity} · ${cat} · ${f.title}`;

  const row = (label: string, value: string) =>
    `<tr>
      <td style="font-family:${FONT};font-size:12px;color:#a1a1aa;padding:5px 14px 5px 0;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="font-family:${FONT};font-size:13px;color:#18181b;padding:5px 0;">${value}</td>
    </tr>`;

  const html = emailShell(`
    <div style="margin-top:20px;display:inline-block;border-radius:999px;background:${color}1f;color:${color};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;">${esc(f.severity)} severity</div>
    <h1 style="font-family:${FONT};font-size:18px;font-weight:700;color:#18181b;margin:12px 0 4px;line-height:1.3;">${esc(f.title)}</h1>
    <p style="font-family:${FONT};font-size:12px;color:#71717a;margin:0 0 18px;">A new concern was raised in the Profile Building Drive portal.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #e4e4e7;padding-top:8px;">
      ${row("Category", esc(cat))}
      ${row("Raised by", esc(f.raisedBy) + (f.raisedByEmail ? ` <span style="color:#71717a;">&lt;${esc(f.raisedByEmail)}&gt;</span>` : ""))}
    </table>
    <div style="margin-top:16px;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;padding:12px 14px;font-family:${FONT};font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(f.description)}</div>
    ${
      f.concernUrl
        ? `<p style="margin:16px 0 0;"><a href="${esc(f.concernUrl)}" style="font-family:${FONT};font-size:13px;font-weight:600;color:#4f46e5;">Open this concern in Forge &rarr;</a></p>`
        : ""
    }
    <p style="margin:18px 0 0;font-family:${FONT};font-size:12px;color:#71717a;">The SLA timer has started. Track the lifecycle under Concerns in the portal.</p>
  `);

  const text = [
    `[Forge Concern] ${f.severity} · ${cat}`,
    f.title,
    "",
    `Category: ${cat}`,
    `Raised by: ${f.raisedBy}${f.raisedByEmail ? ` <${f.raisedByEmail}>` : ""}`,
    "",
    f.description,
    ...(f.concernUrl ? ["", `Open: ${f.concernUrl}`] : []),
  ].join("\n");

  return { subject, html, text };
}
