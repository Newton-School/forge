/**
 * Client-side onboarding-email renderer — used by the admin email-testing preview.
 * Mirrors the server template (`server/src/modules/email/onboarding.ts`) and the design
 * reference (`docs/onboarding-email.html`). Presentation only; the real send is server-side.
 */
const LOGO_URL = "https://res.cloudinary.com/doexqrehm/image/upload/v1781667863/images_hllr4y.png";
export const SUPPORT_EMAIL = "learnercareercouncil@nst.rishihood.edu.in";

export const ONBOARDING_SUBJECT = {
  prod: "Welcome to the Profile Building Drive Portal",
  test: "[TEST] Profile Building Drive Portal - User Onboarding",
};

export interface OnboardingPreviewFields {
  fullName: string;
  role: string;
  domain: string;
  team: string;
  portalUrl: string;
  test?: boolean;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TEST_BANNER = `<tr><td style="background:#fffbeb;border-bottom:1px solid #fcd34d;padding:12px 36px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#92400e;text-transform:uppercase;">&#9888; TEST EMAIL</div>
  <div style="font-size:12px;color:#b45309;margin-top:2px;">For Review &amp; Validation Purposes Only — not a live invitation.</div>
</td></tr>`;

/** Render the onboarding email HTML for an iframe preview. */
export function renderOnboardingEmail(f: OnboardingPreviewFields): string {
  const d = {
    fullName: esc(f.fullName || "there"),
    role: esc(f.role || "Member"),
    domain: esc(f.domain || "—"),
    team: esc(f.team || "—"),
    portalUrl: esc(f.portalUrl || "https://forge.nst.app"),
  };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>body{margin:0;padding:0;background:#fafafa}a{color:#4f46e5}@media only screen and (max-width:620px){.container{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}}</style></head>
<body style="margin:0;padding:0;background:#fafafa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
${f.test ? TEST_BANNER : ""}
<tr><td class="px" style="padding:28px 36px 22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="width:40px;height:40px;vertical-align:middle;"><img src="${LOGO_URL}" width="40" height="40" alt="Newton School of Technology" style="display:block;width:40px;height:40px;border-radius:9px;border:1px solid #e4e4e7;object-fit:cover;"/></td>
  <td style="padding-left:12px;vertical-align:middle;">
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#18181b;line-height:1.2;">Newton School of Technology</div>
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#71717a;line-height:1.4;margin-top:2px;">Learner Career Council &nbsp;&times;&nbsp; Forge</div>
  </td></tr></table></td></tr>
<tr><td style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="px" style="padding:30px 36px 6px;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;">Profile Building Drive</div>
  <h1 style="margin:10px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.25;font-weight:700;color:#18181b;">Welcome to the Profile Building Drive Portal</h1>
  <p style="margin:14px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${d.fullName}, you've been added to <strong>Forge</strong> — the platform the Learner Career Council uses to run the Profile Building Drive. Your account is ready; here's everything you need to sign in.</p>
</td></tr>
<tr><td class="px" style="padding:24px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;"><tr><td style="padding:18px 20px;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#a1a1aa;padding-bottom:12px;">Your account</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;">
    <tr><td style="padding:7px 0;color:#71717a;width:38%;">Name</td><td style="padding:7px 0;color:#18181b;font-weight:600;">${d.fullName}</td></tr>
    <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Role</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.role}</td></tr>
    <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Domain</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.domain}</td></tr>
    <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Team</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.team}</td></tr>
  </table></td></tr></table></td></tr>
<tr><td class="px" style="padding:26px 36px 0;">
  <h2 style="margin:0 0 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#18181b;">How you sign in</h2>
  <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3f3f46;">Forge uses <strong>Google sign-in only</strong> — there is no password to set. Please sign in with the <strong>same email address that received this invitation</strong>.</p>
</td></tr>
<tr><td class="px" align="left" style="padding:20px 36px 0;">
  <a href="${d.portalUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:46px;text-decoration:none;border-radius:9px;padding:0 28px;">Continue with Google &rarr;</a>
</td></tr>
<tr><td class="px" style="padding:26px 36px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;"><tr><td style="padding:16px 20px;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#18181b;">Need help?</div>
  <p style="margin:6px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#52525b;">Reach the Learner Career Council at <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>.</p>
</td></tr></table></td></tr>
<tr><td class="px" style="padding:24px 36px 28px;border-top:1px solid #e4e4e7;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#18181b;">Learner Career Council (LCC)</div>
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#71717a;margin-top:2px;">Newton School of Technology<br/><a href="mailto:${SUPPORT_EMAIL}" style="color:#71717a;text-decoration:underline;">${SUPPORT_EMAIL}</a></div>
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;color:#a1a1aa;margin-top:12px;">Powered by <strong style="color:#52525b;">Forge</strong> &nbsp;·&nbsp; Learner Career Council &times; Forge</div>
</td></tr>
</table></td></tr></table></body></html>`;
}
