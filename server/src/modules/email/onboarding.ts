/**
 * Onboarding invitation email — the runtime source of truth for what Forge sends when
 * a user is provisioned. The design reference is `portal/docs/onboarding-email.html`;
 * this module keeps the same markup so the rendered email matches the reviewed preview.
 *
 * Email-client-safe: table layout, inline CSS, hosted logo with alt-text + wordmark
 * fallback. The `test` flag injects the TEST banner + a `[TEST]` subject for previews.
 */
import { LOGO_URL } from "./branding.js";
import { env } from "../../config/env.js";

/** Support contact + sender — env-configured (no personal data in code). */
export const SUPPORT_EMAIL = (env.SUPPORT_EMAIL ?? env.LCC_EMAIL ?? "").trim();
const SENDER = env.SMTP_FROM ?? (SUPPORT_EMAIL ? `Learner Career Council (LCC) <${SUPPORT_EMAIL}>` : "Forge");

const PROD_SUBJECT = "Welcome to the Profile Building Drive Portal";
const TEST_SUBJECT = "[TEST] Profile Building Drive Portal - User Onboarding";

export interface OnboardingFields {
  fullName: string;
  role: string;
  domain: string;
  team: string;
  portalUrl: string;
  trackUrl?: string; // open-tracking pixel src; omitted for test sends
  test?: boolean;
}

const TEST_BANNER = `<tr><td style="background:#fffbeb;border-bottom:1px solid #fcd34d;padding:12px 36px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#92400e;text-transform:uppercase;">&#9888; TEST EMAIL</div>
  <div style="font-size:12px;color:#b45309;margin-top:2px;">For Review &amp; Validation Purposes Only — not a live invitation.</div>
</td></tr>`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function html(f: { fullName: string; role: string; domain: string; team: string; portalUrl: string }, test: boolean, trackUrl?: string): string {
  const d = {
    fullName: esc(f.fullName), role: esc(f.role), domain: esc(f.domain),
    team: esc(f.team), portalUrl: esc(f.portalUrl),
  };
  const pixel = trackUrl ? `<img src="${esc(trackUrl)}" width="1" height="1" alt="" style="display:none;max-height:0;overflow:hidden;"/>` : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="x-apple-disable-message-reformatting"/><meta name="color-scheme" content="light dark"/>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0} img{-ms-interpolation-mode:bicubic;border:0}
  body{margin:0;padding:0;background:#fafafa} a{color:#4f46e5}
  @media only screen and (max-width:620px){.container{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}}
  @media (prefers-color-scheme:dark){.bg-page{background:#0b0b0f!important}.bg-card{background:#18181b!important}}
</style></head>
<body class="bg-page" style="margin:0;padding:0;background:#fafafa;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fafafa;opacity:0;">You've been granted access to the Profile Building Drive Portal — sign in with your Google account to get started.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="container bg-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
${test ? TEST_BANNER : ""}
<tr><td class="px" style="padding:28px 36px 22px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="width:40px;height:40px;vertical-align:middle;"><img src="${LOGO_URL}" width="40" height="40" alt="Forge" style="display:block;width:40px;height:40px;border-radius:9px;border:1px solid #e4e4e7;object-fit:cover;"/></td>
    <td style="padding-left:12px;vertical-align:middle;">
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#18181b;line-height:1.2;">Forge</div>
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#71717a;line-height:1.4;margin-top:2px;">LCC &nbsp;&times;&nbsp; NST</div>
    </td></tr></table>
</td></tr>
<tr><td style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="px" style="padding:30px 36px 6px;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;">Profile Building Drive</div>
  <h1 style="margin:10px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.25;font-weight:700;color:#18181b;">Welcome to the Profile Building Drive Portal</h1>
  <p style="margin:14px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${d.fullName}, you've been added to <strong>Forge</strong> — the platform the Learner Career Council uses to run the Profile Building Drive. Your account is ready; here's everything you need to sign in.</p>
</td></tr>
<tr><td class="px" style="padding:24px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;"><tr><td style="padding:18px 20px;">
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#a1a1aa;padding-bottom:12px;">Your account</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:7px 0;color:#71717a;width:38%;">Name</td><td style="padding:7px 0;color:#18181b;font-weight:600;">${d.fullName}</td></tr>
      <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Role</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.role}</td></tr>
      <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Domain</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.domain}</td></tr>
      <tr><td style="padding:7px 0;color:#71717a;border-top:1px solid #ececef;">Team</td><td style="padding:7px 0;color:#18181b;font-weight:600;border-top:1px solid #ececef;">${d.team}</td></tr>
    </table>
  </td></tr></table>
</td></tr>
<tr><td class="px" style="padding:26px 36px 0;">
  <h2 style="margin:0 0 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#18181b;">How you sign in</h2>
  <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3f3f46;">Forge uses <strong>Google sign-in only</strong> — there is no password to set. Please sign in with the <strong>same email address that received this invitation</strong>; access is granted to that account specifically.</p>
</td></tr>
<tr><td class="px" align="left" style="padding:20px 36px 0;">
  <a href="${d.portalUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:46px;text-align:center;text-decoration:none;border-radius:9px;padding:0 28px;">Continue with Google &rarr;</a>
</td></tr>
<tr><td class="px" style="padding:26px 36px 0;">
  <h2 style="margin:0 0 10px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#18181b;">Getting started</h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#3f3f46;">
    <tr><td style="padding:3px 0;"><strong style="color:#4f46e5;">1.</strong>&nbsp; Open the portal: <a href="${d.portalUrl}" style="color:#4f46e5;word-break:break-all;">${d.portalUrl}</a></td></tr>
    <tr><td style="padding:3px 0;"><strong style="color:#4f46e5;">2.</strong>&nbsp; Click <strong>Continue with Google</strong> and choose your invited email.</td></tr>
    <tr><td style="padding:3px 0;"><strong style="color:#4f46e5;">3.</strong>&nbsp; You'll land on your <strong>${d.role}</strong> dashboard for the <strong>${d.domain}</strong> domain.</td></tr>
  </table>
  <p style="margin:14px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.6;color:#52525b;">As a <strong>${d.role}</strong>, you'll track progress, updates and reviews through the portal. Your mentor and the LCC will share specifics for your team after you sign in.</p>
</td></tr>
<tr><td class="px" style="padding:24px 36px 4px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;"><tr><td style="padding:16px 20px;">
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#18181b;">Need help?</div>
    <p style="margin:6px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#52525b;">Reach the Learner Career Council at <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>. If your sign-in is rejected, your email may not be provisioned yet — reply to this invitation and the LCC will resolve it.</p>
  </td></tr></table>
</td></tr>
<tr><td class="px" style="padding:24px 36px 28px;border-top:1px solid #e4e4e7;">
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#18181b;">Learner Career Council (LCC)</div>
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#71717a;margin-top:2px;">Newton School of Technology<br/><a href="mailto:${SUPPORT_EMAIL}" style="color:#71717a;text-decoration:underline;">${SUPPORT_EMAIL}</a></div>
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;color:#a1a1aa;margin-top:12px;">Powered by <strong style="color:#52525b;">Forge</strong> &nbsp;·&nbsp; LCC &times; NST<br/>This is an automated invitation. If you weren't expecting it, you can ignore this email.</div>
</td></tr>
</table></td></tr></table>${pixel}</body></html>`;
}

function text(f: { fullName: string; role: string; domain: string; team: string; portalUrl: string }, test: boolean): string {
  const head = test ? "[TEST EMAIL — For Review & Validation Purposes Only]\n\n" : "";
  return `${head}WELCOME TO THE PROFILE BUILDING DRIVE PORTAL
Forge — LCC x NST

Hi ${f.fullName},

You've been added to Forge, the platform the Learner Career Council uses to run
the Profile Building Drive. Your account is ready.

YOUR ACCOUNT
  Name   : ${f.fullName}
  Role   : ${f.role}
  Domain : ${f.domain}
  Team   : ${f.team}

HOW YOU SIGN IN
Forge uses Google sign-in only — there is no password to set. Please sign in
with the SAME email address that received this invitation.

GET STARTED
  1. Open the portal: ${f.portalUrl}
  2. Click "Continue with Google" and choose your invited email.
  3. You'll land on your ${f.role} dashboard for the ${f.domain} domain.

NEED HELP?
Reach the Learner Career Council at ${SUPPORT_EMAIL}.

—
Learner Career Council (LCC)
Newton School of Technology
${SUPPORT_EMAIL}
Powered by Forge`;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
  from: string;
}

/** Render the onboarding email (production or [TEST] variant). */
export function buildOnboardingEmail(f: OnboardingFields): BuiltEmail {
  const filled = {
    fullName: f.fullName || "there",
    role: f.role || "Member",
    domain: f.domain || "—",
    team: f.team || "—",
    portalUrl: f.portalUrl,
  };
  const test = Boolean(f.test);
  return {
    subject: test ? TEST_SUBJECT : PROD_SUBJECT,
    html: html(filled, test, f.trackUrl),
    text: text(filled, test),
    from: SENDER,
  };
}
