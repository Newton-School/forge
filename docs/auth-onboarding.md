# Invite-Only Authentication & Onboarding — Design

**Status:** Phase 1 design (this document + the HTML deliverables). Backend (Phase 2), UIs (Phase 3) and the live test-send (Phase 4) implement against this spec.

This is the authoritative reference for Forge's invite-only access model and the user-onboarding email system. It documents what **already exists** (so we don't rebuild it), the **schema/RBAC changes** the later phases apply, and the **branding** rules.

Related artifacts: [`onboarding-email.html`](onboarding-email.html) (production email template), [`email-preview.html`](email-preview.html) (stakeholder preview + plain-text), [`auth-flow.html`](auth-flow.html) (visual flow). Authoritative platform rules remain `portal/CLAUDE.md` (§4 auth, §5 RBAC) — the RBAC change below lands there in Phase 2.

---

## 1. Authentication architecture

**Google OAuth is the only authentication mechanism.** No email/password, no username/password, no magic links, no signup forms, no self-registration, no public onboarding. The login page exposes only **Continue with Google**.

The platform is **private**: being authenticated by Google does **not** grant access — the email must already exist in the database (admin-provisioned allowlist).

### What already exists (verified — do not rebuild)
| Capability | Where |
|---|---|
| Google OIDC/OAuth strategy | `server/src/middleware/passport.ts` (`configurePassport`) |
| Allowlist + status gate | `server/src/modules/auth/auth.service.ts` → `resolveGoogleLogin` (≈line 21) |
| Hosted-domain check (`rishihood.edu.in`) | `server/src/modules/auth/auth.gate.ts` → `hostedDomainAllowed` |
| Reject SUSPENDED/DEACTIVATED; INVITED→ACTIVE on first login | `auth.service.ts` (≈lines 28–36) |
| Server-side sessions (Redis), opaque HttpOnly cookie, CSRF | `middleware/session.ts`, `middleware/security.ts` |
| Login page (Google-only) + denied message | `client/app/(auth)/login/page.tsx` |
| Create-user endpoint (status defaults INVITED) | `server/src/modules/users/{routes,service,repository}.ts` |
| Email transport (nodemailer + console adapter) + `{{}}` templating | `server/src/modules/email/{email.provider,email.templates}.ts` |
| `Invitation`, `EmailTemplate`, `PasswordReset` models | `server/prisma/schema.prisma` |

### Access validation (every login — server-side)
All must pass before a session is created: **(1)** email exists in DB · **(2)** hosted domain is `rishihood.edu.in` · **(3)** account ACTIVE / not suspended · **(4)** has an assigned role · **(5)** has portal access. Google auth alone is never sufficient. Rejection → access-denied message on `/login`; **no session created**.

### What's missing (the build)
The `Invitation` model exists but has **zero code references**. User creation never creates an invitation or sends an email. LCC cannot create users. There is no invitation-tracking or email-testing UI. Those are Phases 2–3.

---

## 2. Database schema changes (applied in Phase 2)

**Extend `Invitation`** (currently `id, userId, token, expiresAt, acceptedAt, createdAt`) with tracking fields:

```prisma
model Invitation {
  id         String           @id @default(cuid())
  userId     String
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  email      String                         // denormalized recipient (audit + resend)
  token      String           @unique
  status     InvitationStatus @default(PENDING)
  expiresAt  DateTime
  sentAt     DateTime?                       // set when the email is dispatched
  openedAt   DateTime?                       // set by the tracking pixel
  acceptedAt DateTime?                       // set on first successful Google sign-in
  createdAt  DateTime         @default(now())
  @@index([userId])
  @@index([status])
}

enum InvitationStatus { PENDING SENT OPENED COMPLETED EXPIRED }
```

**`UserStatus` — keep the existing enum, map to the spec's labels** (no rename — avoids churn across the codebase):

| Spec label | Existing enum value |
|---|---|
| Pending Invitation | `INVITED` |
| Active | `ACTIVE` |
| Suspended | `SUSPENDED` |
| Disabled | `DEACTIVATED` |

Labels are surfaced in the UI; the enum is unchanged. Migration is **versioned and non-destructive** (additive columns + new enum).

---

## 3. RBAC changes (applied in Phase 2)

Admin retains everything. **LCC gains user onboarding:**

| Permission | Today | After |
|---|---|---|
| `user:create` | ADMIN | ADMIN, **LCC** |
| `user:update` | ADMIN | ADMIN, **LCC** |
| `invitation:send` *(new)* | — | ADMIN, **LCC** |
| `invitation:read` *(new)* | — | ADMIN, **LCC** |

Enforced through the existing three layers (route gate → `can(user, action, resource)` → scope-filtered query). LCC is GLOBAL-scoped, so it may onboard across domains. Changes land in `server/src/rbac/permissions.ts`, the policy tests, and **CLAUDE.md §5** in the same Phase-2 change (per the repo rule that an architecture change updates CLAUDE.md alongside the code).

---

## 4. User & invitation lifecycle

```
Admin/LCC create user (Name, Email, Role, Domain, Team?, Mentor?, Status=Pending)
   → create Invitation (token + expiresAt, status PENDING)
   → render onboarding email + send  → status SENT (sentAt)
   → recipient opens email           → status OPENED (openedAt, via tracking pixel)
   → recipient clicks portal link → Continue with Google → access validation passes
   → status COMPLETED (acceptedAt); User INVITED → ACTIVE; session created
```
Edge cases: link past `expiresAt` before completion → **EXPIRED** (Admin/LCC **resend** reissues a fresh token + email). Resend is available at any pre-COMPLETED state. Completion reuses the **existing** `resolveGoogleLogin` INVITED→ACTIVE transition — the invitation layer only stamps `acceptedAt`/COMPLETED.

---

## 5. Onboarding email system

- **Template:** `onboarding-email.html` is seeded as an `EmailTemplate` row (HTML body + plain-text alternative); merge fields `{{fullName}} {{role}} {{domain}} {{team}} {{portalUrl}} {{supportEmail}} {{testBanner}}` are filled by the existing `renderTemplate` (`email.templates.ts`). Auto-sent on user create via the existing `email.service` + nodemailer provider.
- **Open tracking:** `GET /api/email/track/:token.png` returns a 1×1 pixel and stamps `openedAt` / status OPENED.
- **Test sends:** `POST /api/email/test-onboarding { recipients[] }` renders the **[TEST]** variant — `{{testBanner}}` = the "TEST EMAIL — For Review & Validation Purposes Only" banner, subject `[TEST] Profile Building Drive Portal - User Onboarding`. `email:send`-gated, recipient-capped, audited. Initial validation recipients are listed in the Phase-4 step (8 addresses).
- **Future templates** (same system): reminders, milestones, concern notifications, announcements, mentor notifications.

### Sender & branding identity
- **Sender:** `Learner Career Council (LCC) <learnercareercouncil@nst.rishihood.edu.in>`.
- **Visible branding:** **Learner Career Council (LCC) × Forge × Newton School of Technology** only. The footer carries LCC · Forge · NST · the support email · "Powered by Forge". **"Rishihood University" is not shown anywhere** in the email or onboarding UI (the login email domain `rishihood.edu.in` is a separate, unaffected technical detail). NST mark is a typographic wordmark (reliable across Gmail/Outlook); a hosted logo URL can replace it later.
- **Logo:** hosted NST mark (`res.cloudinary.com/doexqrehm/…/images_hllr4y.png`) in the header, with `alt="Newton School of Technology"` + the adjacent wordmark as a fallback if a client blocks images.
- **Tone:** enterprise/internal (GitHub Enterprise / Notion / Linear), **white surfaces + 1px borders** (matching the portal UI — no gray fills, no shadows, one indigo accent), minimal — not newsletter/marketing.

---

## 6. Admin & LCC dashboards (Phase 3)

- **User management** (Admin + LCC): create/edit/suspend/disable; assign role, domain, team, mentor; status. Creating a user triggers the invitation + email.
- **Invitation management** (Admin + LCC): list with status chips (Pending/Sent/Opened/Completed/Expired), **Resend**, **Revoke**, timestamps.
- **Email testing** (Admin/LCC): live HTML + mobile preview, recipient selection (incl. the 8 presets), Send Test, delivery status, email logs.
- **Access-denied** screen polish + LCC nav entries.

---

## 7. Phasing

| Phase | Scope | Touches |
|---|---|---|
| **1 (this)** | This doc + `onboarding-email.html` + `email-preview.html` + `auth-flow.html` | `portal/docs/` only |
| **2** | Migration, invitation service, auto-send, open-tracking, test endpoint, RBAC + CLAUDE.md | `server/` |
| **3** | Admin/LCC user + invitation + email-testing UIs, access-denied polish | `client/` |
| **4** | Gated live **[TEST]** send to the 8 validation recipients (explicit confirm) | runtime |
