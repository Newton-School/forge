# Security & RBAC Architecture

> This document fully specifies authentication, authorization, data isolation, and application security so they can be **implemented in a later phase without refactoring**. Phase 1 ships the RBAC config and policy functions as code, used for **UI rendering only** — no enforcement middleware yet.

---

## 1. Authentication (recommended: Auth.js v5, JWT session, Argon2id)

See [architecture.md §8](./architecture.md) for the full options comparison. Decision: **Auth.js (NextAuth v5) Credentials provider, stateless JWT session in an httpOnly cookie, Prisma adapter for the user store, Argon2id password hashing.** Serverless-friendly (no session store, no Redis), audited security defaults, trivial future SSO.

### 1.1 Authentication security controls

| Control | Design |
|---|---|
| Password hashing | **Argon2id** (memory-hard) with per-user salt; tuned params; never MD5/SHA/bcrypt-only. |
| First-login change | `User.mustChangePassword` forces the change flow before any dashboard access. |
| Password reset | Single-use, time-limited (`PasswordReset.token`, ~30 min expiry), emailed link; token hashed at rest. |
| Email invitation | `Invitation.token` single-use + expiry; activation sets password and clears `mustChangePassword`. |
| Account lockout | Track failed attempts; lock after N (configurable, default 5) for a cooldown; exponential backoff. |
| Brute-force / throttling | Per-IP + per-account rate limits on `/login`, `/forgot-password`, `/reset-password`. |
| Session revocation | `User.tokenVersion` claim in JWT; bump on password change / role change / suspension to invalidate all sessions without a session table. |
| Cookie flags | `httpOnly`, `Secure`, `SameSite=Lax`, scoped path; short access lifetime (30–60 min) with rolling refresh. |
| MFA (future) | TOTP enrollment hook in Auth.js callbacks; `User.mfaSecret` reserved in schema. |
| SSO (future) | Add Google/Microsoft/University providers to Auth.js; Prisma adapter already persists accounts. |

### 1.2 Auth flows

```
INVITE:    Admin creates User(Invited) → email invite(token) → user sets password → status Active
LOGIN:     email+password → Argon2id verify → issue JWT{sub,role,scopes,tokenVersion,mustChangePassword}
FIRST:     if mustChangePassword → force change → bump tokenVersion → re-issue
RESET:     request → email reset(token) → set new password → bump tokenVersion → invalidate sessions
LOCKOUT:   failed attempts ≥ N → temporary lock + audit + (optional) notify user
```

---

## 2. RBAC Model — `(Role) × (Scope)`

Authorization needs **both** "what may this role do?" and "to which records?". We model them separately and combine in a policy function.

### 2.1 Roles (role hierarchy)

```
ADMIN          (global, everything incl. system config)
  └ LCC        (global read + coordination/concern/email actions; no system config)
       └ TEACHER    (one or more DOMAINS)
            └ MENTOR   (assigned TEAM + MENTEES — the Student Mentor leads the team)
                 └ MENTEE          (SELF)
```

> **Note:** The Student **Mentor** is also the team lead — there is no separate Team Lead role. The Mentor holds both mentee-management and team-delivery permissions.

Hierarchy implies **visibility inheritance**, not unconditional power: a Teacher sees everything in their domain; LCC sees all domains (read) but cannot change system config; Admin alone configures the system.

### 2.2 Scopes (scope hierarchy)

| Scope | Meaning | Resolver (Phase 3) |
|---|---|---|
| `GLOBAL` | all records | Admin, LCC |
| `DOMAIN:<id>` | records under a domain | Teacher → `Domain.teacherId = me` |
| `TEAM:<id>` | records under a team | Mentor → `Team.mentorId = me` (the Student Mentor leads the team) |
| `SELF` | records owned by the user | Mentee → `ownerId = me` |

A user may hold **multiple scoped roles** (`UserRole` rows). Effective access = union of scopes for the action's required permission.

### 2.3 Permissions (actions)

Permissions are `resource:action` strings, e.g. `user:create`, `concern:resolve`, `weeklyReview:l4Submit`, `email:bulkSend`, `config:edit`, `auditLog:read`. The complete set lives in `lib/rbac/permissions.ts`.

### 2.4 Permission matrix (canonical — abbreviated; full table in PRD §6.2)

Legend: ✅ full · 🔵 own/assigned scope · 👁 read · ➖ none

The **Mentor** column reflects the merged role: the Student Mentor manages mentees **and** leads team delivery (board/issues/PRs, blockers, team deliverables).

| Permission | Admin | LCC | Teacher | Mentor | Mentee |
|---|:--:|:--:|:--:|:--:|:--:|
| `user:create` / `user:import` | ✅ | ➖ | ➖ | ➖ | ➖ |
| `role:assign` | ✅ | ➖ | ➖ | ➖ | ➖ |
| `domain:manage` | ✅ | 👁 | 👁(own) | ➖ | ➖ |
| `team:manage` | ✅ | 🔵 | 🔵(domain) | 👁 | 👁(own) |
| `config:edit` (phases/gates/cycles/thresholds/rubrics) | ✅ | 🔵 | 🔵(domain rubric) | ➖ | ➖ |
| `menteeUpdate:submit` (L1) | ➖ | ➖ | ➖ | ➖ | 🔵 |
| `mentorStatus:submit` (L2) | ✅ | 👁 | 👁 | 🔵 | ➖ |
| `weeklyReview:l3Submit` | ✅ | 👁 | 👁 | 🔵 | ➖ |
| `weeklyReview:l4Submit` | ✅ | 👁 | 🔵 | 👁 | ➖ |
| `gate:decide` | ✅ | 👁 | 🔵 | ➖ | ➖ |
| `mentorFeedback:submit` (360°) | ➖ | 👁 | 👁 | ➖ | 🔵 |
| `task:assign` | ✅ | 🔵 | 🔵 | 🔵 | ➖ |
| `deliverable:review` | ✅ | 👁 | 🔵 | 🔵 | ➖ |
| `deliverable:submit` | ➖ | ➖ | ➖ | 🔵 | 🔵 |
| `concern:raise` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `concern:triage` / `concern:resolve` | ✅ | ✅ | 🔵(domain) | ➖ | ➖ |
| `email:bulkSend` | ✅ | ✅ | 🔵(domain) | 🔵(team) | ➖ |
| `emailTemplate:manage` | ✅ | 🔵 | ➖ | ➖ | ➖ |
| `analytics:global` | ✅ | ✅ | ➖ | ➖ | ➖ |
| `analytics:domain` | ✅ | ✅ | 🔵 | ➖ | ➖ |
| `analytics:team` | ✅ | ✅ | 🔵 | 🔵 | ➖ |
| `auditLog:read` | ✅ | 👁(scoped) | ➖ | ➖ | ➖ |
| `integration:manage` | ✅ | 👁 | ➖ | ➖ | ➖ |
| `demerit:manage` | ✅ | 🔵 | 👁 | 👁 | ➖ |

---

## 3. Policy Architecture

### 3.1 The single decision function

```ts
// lib/rbac/policy.ts  (Phase 1: used for UI; Phase 3: used everywhere)
can(ctx: AuthContext, action: Permission, resource?: Resource): boolean
```

- **Step 1 — role check:** does any of `ctx.roles` grant `action`?
- **Step 2 — scope check:** if a `resource` is given, does the granting role's scope cover it? (`GLOBAL` ⊇ `DOMAIN` ⊇ `TEAM` ⊇ `SELF`, matched by id.)
- **Step 3 — ownership check:** for `SELF` actions, `resource.ownerId === ctx.userId`.

UI calls `can()` to show/hide controls. The server calls the **same** `can()` plus query-level scoping (below).

### 3.2 Access-control flow (request lifecycle, Phase 3)

```
Request
  │
  ▼
proxy.ts (route gate)  ── is route allowed for ctx.role? ──▶ 403 if not
  │  (Phase 1: NOT present)
  ▼
Server Action / Route Handler
  │  1) getAuthContext()        (decode JWT, load minimal user)
  │  2) can(ctx, action, res)   (policy)              ──▶ 403 if false
  │  3) zod validate(input)                            ──▶ 400 if invalid
  │  4) service.method(ctx, …)  (SCOPE-FILTERED query) ──▶ data isolation
  │  5) audit(ctx, action, before/after)
  ▼
Typed response (no internal leakage)
```

### 3.3 Data isolation — enforced at the query layer (defense in depth)

Authorization is **not** only a route check. Every service method **injects the caller's scope into the database query**, so even a logic bug elsewhere cannot return out-of-scope rows.

```ts
// Example: a Teacher listing teams — physically cannot see other domains
function listTeams(ctx: AuthContext) {
  return prisma.team.findMany({
    where: scopeWhere(ctx, {
      global:  {},                                  // Admin/LCC
      domain:  { domain: { teacherId: ctx.userId } },// Teacher
      team:    { OR: [{ mentorId: ctx.userId }, { teamLeadId: ctx.userId }] },
      self:    { members: { some: { userId: ctx.userId } } },
    }),
  })
}
```

`scopeWhere()` (`lib/rbac/scope.ts`) returns the correct Prisma `where` clause for the caller's highest applicable scope. **Three layers of defense:** route gate (`proxy.ts`) → policy (`can`) → query scope (`scopeWhere`).

### 3.4 Worked examples (from the brief)

- **Teacher** queries students → `scopeWhere` resolves to `{ team: { domain: { teacherId: me } } }`. Other domains' students are unreachable.
- **Mentor** queries reviews → `{ menteeId: { in: assignedMenteeIds(me) } }`. Unassigned mentees are unreachable.
- **Mentee** queries tasks → `{ assigneeId: me }` (SELF). Cannot see anyone else's tasks/submissions/reviews.
- **Admin** → `GLOBAL`, no scope filter.

---

## 4. Application Security

| Threat | Mitigation |
|---|---|
| CSRF | Auth.js built-in CSRF tokens; Server Actions are same-origin + framework-protected. |
| XSS | React auto-escaping; sanitize rich-text (email/announcement bodies) with an allowlist sanitizer; never `dangerouslySetInnerHTML` on user input. |
| SQL injection | Prisma parameterized queries only; no raw string SQL with user input. |
| Input validation | **Zod** schemas at every action/handler boundary; reject unknown fields. |
| Output sanitization | Encode on render; strip HTML from untrusted sources. |
| Secure file uploads | Type+size allowlist, AV scan (Phase 3), store in object storage, serve via signed time-limited URLs, never executable. |
| Rate limiting | Per-IP/user throttle on auth + write endpoints (Phase 3; in-memory token bucket acceptable on single region, upgradeable to Upstash). |
| Security headers | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS — via `next.config.ts` headers / `proxy.ts`. |
| Secure cookies | httpOnly/Secure/SameSite (see §1.1). |
| Secrets | `.env` only (git-ignored), Vercel encrypted env vars in prod; never in client bundle; only `NEXT_PUBLIC_*` reaches the browser. |
| Webhook security | Verify GitHub HMAC signature + Discord signature; reject replays. |

### 4.1 Data security
- **In transit:** TLS everywhere (Vercel + Neon enforce SSL; connection string uses `sslmode=require`).
- **At rest:** Neon-managed encryption; integration credentials stored encrypted (app-level envelope encryption for tokens).
- **PII access** gated by RBAC; **anonymous concerns** supported (`Concern.anonymous`); configurable retention.

---

## 5. Auditability

`AuditLog` is append-only and captures **actor, action, entityType, entityId, before/after JSON, IP, timestamp**. Tracked events (per brief):

- Auth: login, logout, failed login/lockout, password change, password reset.
- Identity: user creation, role change, permission/scope change, suspension/deactivation.
- Concerns: every status transition (also mirrored in `ConcernEvent`).
- Communications: email send / bulk send / template change.
- Administrative: any `config:edit`, integration connect/disconnect.

Audit writes happen in the **service layer** (step 5 of the request lifecycle), so no privileged action bypasses logging. The Admin → Audit Logs screen reads this with filters (actor, action, entity, date).

---

## 6. University-grade posture & future-proofing
- Assume **thousands of users, multiple domains, sensitive academic data** → default-deny, least privilege, query-level isolation, full audit.
- Architecture supports, without rewrite: **Google/Microsoft/University SSO**, **MFA (TOTP)**, **fine-grained permissions** (the permission set is data-extensible), **security audits/compliance** (audit log + scoped access already in place).

---

## 7. Phase 1 boundary (what is NOT enforced yet — by design)
- ❌ No `proxy.ts` route protection.
- ❌ No live Auth.js session / login enforcement (login UI posts to a stub; a dev Role Switcher previews each dashboard).
- ❌ No server-side query scoping executing against a real DB (services return mock data).
- ✅ **Present now:** roles, permissions, `can()`, `scopeWhere()` shapes, permission matrix, and RBAC-aware UI rendering — so Phase 3 only **activates** these, never rewrites them.
