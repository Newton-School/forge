/**
 * Shared Forge email branding — one place for the logo, the header lockup
 * ("Forge · LCC × NST"), and a clean email-client-safe shell. Used by every
 * outbound template so the brand stays consistent.
 */
export const LOGO_URL = "https://res.cloudinary.com/doexqrehm/image/upload/v1781937005/logo_rwn9ky.png";

const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

/** Escape user-supplied text before interpolating into email HTML. */
export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Forge brand header (logo + "Forge / LCC × NST") as an email-safe table. */
export function brandHeader(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <td style="width:40px;height:40px;vertical-align:middle;"><img src="${LOGO_URL}" width="40" height="40" alt="Forge" style="display:block;width:40px;height:40px;border-radius:9px;border:1px solid #e4e4e7;object-fit:cover;"/></td>
      <td style="padding-left:12px;vertical-align:middle;">
        <div style="font-family:${FONT};font-size:15px;font-weight:700;color:#18181b;line-height:1.2;">Forge</div>
        <div style="font-family:${FONT};font-size:12px;color:#71717a;line-height:1.4;margin-top:2px;">LCC &nbsp;&times;&nbsp; NST</div>
      </td>
    </tr>
  </table>`;
}

/** Wrap body HTML in a centered, branded card (header on top). */
export function emailShell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:92%;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:28px;">
        <tr><td style="padding-bottom:6px;border-bottom:1px solid #f4f4f5;">${brandHeader()}</td></tr>
        <tr><td>${bodyHtml}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
