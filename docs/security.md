# Security Architecture

> Enterprise-grade security for the **Forge** client/server platform on **AWS ECS Fargate**, storing sensitive academic data: students, mentors, teachers, reviews, feedback, concerns, and performance metrics. Security is a **first-class concern**, not a phase. This document is the authoritative reference for authentication, sessions, authorization, data isolation, AWS account isolation, app security, secrets, audit, and threat modeling.
>
> **Cross-references:** [`architecture-v2.md`](./architecture-v2.md) (system design, services, data model) · [`infra-ecs.md`](./infra-ecs.md) (VPC, ECS, RDS, ALB, KMS, Secrets) · [`integration-setup.md`](./integration-setup.md) (GitHub, Discord, Google Calendar credentials & webhooks).

---

## Topology at a glance

```
            Internet
               │  (TLS 1.2+)
               ▼
        ┌─────────────┐   Cloudflare (WAF, DDoS, TLS termination edge)
        │ Cloudflare  │
        └─────────────┘
               │  (TLS, origin cert / mTLS to ALB)
               ▼
        ┌─────────────┐   Public subnets only
        │     ALB     │   (HTTPS:443, HSTS, security groups)
        └─────────────┐
               │  (TLS in VPC)
   ┌───────────┴───────────┐
   ▼                       ▼            Private subnets (no public IPs)
┌────────────┐      ┌────────────┐
│ Next.js    │ ───▶ │ Express +  │  ALL authz + business logic + integrations
│ (ECS)      │ HTTP │ TS API     │  live here. Frontend never reaches DB/3P.
│ SSR/UI     │      │ (ECS)      │
└────────────┘      └─────┬──────┘
                          │  (TLS, sslmode=require)
                ┌─────────┴─────────┐
                ▼                   ▼          Private/isolated subnets
          ┌──────────┐        ┌──────────┐
          │ RDS      │        │ Redis    │  (optional: sessions, cache, rate limit)
          │ Postgres │        │ Elasticache
          └──────────┘        └──────────┘
```

**Canonical rule:** the frontend (Next.js) **never** calls the database or external integrations directly. It calls the Express API. All authorization and business logic are **server-side**. Anything rendered client-side that depends on permissions is a **UI hint only**.

---

## 1. Security principles & posture

| Principle | How it shows up here |
|---|---|
| **Default deny** | No route, action, or row is accessible unless a policy explicitly grants it. Unknown = rejected. |
| **Least privilege** | IAM, security groups, OAuth scopes, DB grants, and roles all grant the minimum required. |
| **Defense in depth** | Authz enforced at **three** layers (route gate → policy → query scope); secrets at rest + in transit; network + app + data controls stack. |
| **Server-authoritative** | The browser holds only an **opaque session id**. No JWT, no role, no permission, no token in browser storage is ever trusted. |
| **Zero blast radius** | This platform shares an AWS account with unrelated services. It is isolated such that a full compromise here **cannot** reach them (§6). |
| **Auditable** | Every privileged/state-changing action writes an immutable `AuditLog` row in the service layer (§10). |
| **Fail closed** | On any auth/authz/validation error → 401/403/400, never partial data. Errors never leak internal structure. |
| **Sensitive-data minimization** | Anonymous concerns, scoped PII access, retention windows, minimized integration scopes/intents. |

Posture assumption: **thousands of users, multiple academic domains, sensitive minors' performance data, a shared multi-tenant AWS account.** Designed for university-grade scrutiny and external security audit.

---

## 2. Authentication — Google OAuth (OIDC) only

**Decision: Google OAuth via OIDC is the *only* authentication method.** No email/password, no self-signup, no custom credentials, no magic links. The server runs the OIDC **authorization-code flow**, validates the **ID token**, and gates access on two independent conditions.

### 2.1 Why no signup / no password

| Concern | Why Google-OIDC-only wins |
|---|---|
| Password storage | None to store → no hashing, no leaks, no reset flows, no credential-stuffing surface. |
| MFA | **Inherited** from the user's Google/Workspace account (institution-enforced 2FA). |
| Phishing resistance | Leverages Google's anti-phishing and risk signals. |
| Provisioning control | Access is **admin-allowlist only** — being a valid Google user is necessary but **not sufficient**. |
| Account lifecycle | De-provisioning is a DB operation; no orphaned passwords. |

### 2.2 Full sequence (authorization-code flow)

```
Browser            Next.js (ECS)        Express API (ECS)        Google OIDC         RDS Postgres
   │  GET /login        │                      │                     │                    │
   │───────────────────▶│                      │                     │                    │
   │                    │  start auth (server) │                     │                    │
   │                    │─────────────────────▶│                     │                    │
   │                    │   redirect w/ state, │  generate state+    │                    │
   │                    │   nonce, PKCE        │  nonce+PKCE (stored  │                    │
   │   302 to Google ◀──┼──────────────────────┤  server-side)       │                    │
   │◀───────────────────┘                      │                     │                    │
   │  authenticate + consent at accounts.google.com ─────────────────▶│                    │
   │◀──── 302 back to /api/auth/callback?code=…&state=… ─────────────│                    │
   │  GET /api/auth/callback?code,state        │                     │                    │
   │──────────────────────────────────────────▶│                     │                    │
   │                                           │  verify state match │                    │
   │                                           │  exchange code +    │                    │
   │                                           │  PKCE verifier ────▶│  /token            │
   │                                           │◀─── id_token,       │                    │
   │                                           │     access_token,   │                    │
   │                                           │     refresh_token   │                    │
   │                                           │  validate id_token  │                    │
   │                                           │  (sig via JWKS,     │                    │
   │                                           │   iss/aud/exp/nonce)│                    │
   │                                           │  check hd claim ────┼────────────────────┤
   │                                           │  lookup email in   ─┼──▶ SELECT … users   │
   │                                           │   users (allowlist) │   WHERE email=?    │
   │                                           │◀──── role+perms ────┼────────────────────┤
   │                                           │  store OAuth tokens │                    │
   │                                           │  server-side; create│                    │
   │                                           │  session; set cookie│                    │
   │◀──── 302 /dashboard  Set-Cookie: sid=opaque; HttpOnly; Secure ──│                    │
```

### 2.3 ID-token validation checklist (all MUST pass)

| # | Check | Detail |
|---|---|---|
| 1 | **Signature** | Verify JWS against Google's **JWKS** (`https://www.googleapis.com/oauth2/v3/certs`); cache keys, honor `kid` rotation. |
| 2 | **`iss`** | Equals `https://accounts.google.com` **or** `accounts.google.com`. Reject anything else. |
| 3 | **`aud`** | Equals **our** Google OAuth client id. Reject tokens minted for other clients. |
| 4 | **`exp`** | Not expired (with small clock-skew leeway, e.g. ≤ 60s). |
| 5 | **`iat` / `nbf`** | Issued in the past (within skew); not yet-to-be-valid. |
| 6 | **`nonce`** | Equals the server-generated nonce bound to this auth request (replay protection). |
| 7 | **`hd`** (hosted domain) | Equals an **allowed institution domain** (e.g. `rishihood.edu.in`). Gate (a). |
| 8 | **`email_verified`** | Must be `true`. |
| 9 | **DB allowlist** | `email` exists in the `users` table (admin-provisioned). Gate (b). |
| 10 | **`state` + PKCE** | `state` matches the stored value; PKCE `code_verifier` validates the exchange. |

### 2.4 The dual gate (hosted-domain AND DB-allowlist)

Access is granted **only if BOTH** hold:

```
   (a) Google hd claim ∈ { rishihood.edu.in, … }        ← right institution
        AND
   (b) email ∈ users table (admin pre-created)          ← explicitly provisioned

   ┌──────────────────────────┬───────────────────────────────┐
   │ Email                    │ Outcome                       │
   ├──────────────────────────┼───────────────────────────────┤
   │ taj@rishihood.edu.in     │ ✅ hd ok + in users → ALLOW   │
   │ guest@rishihood.edu.in   │ ❌ hd ok but NOT in users → DENY │
   │ random@gmail.com         │ ❌ wrong hd (+ not in users) → DENY │
   └──────────────────────────┴───────────────────────────────┘
```

Belonging to the institution's Google domain is **necessary but not sufficient**. The DB allowlist is authoritative for *who* may enter and *what* they may do.

### 2.5 Roles & permissions come from the DB

On a successful login, the user's **role(s) and scopes are loaded from the `users` / `user_roles` tables** — never from anything in the OAuth token. The token proves *identity*; the DB decides *authority*. A server-side session is then created (§3).

### 2.6 Account provisioning (admin pre-creates users)

```
Admin → Users → Add user
   │  enter email (institution domain), role, scope (domain/team), display name
   ▼
INSERT users(email, role, scope, status='active')   ← allowlist entry
   ▼
User can now log in with Google. No invite email or password is required.
```

- **First login needs no password change** — identity is Google's; there is nothing to set. The first successful OIDC login simply activates the session and (optionally) stamps `users.firstLoginAt`.
- Admin-only: `user:create`, `user:import` (bulk CSV → same allowlist rows), `role:assign`.

### 2.7 De-provisioning

```
Admin → Users → Deactivate / Delete
   ▼
UPDATE users SET status='disabled'      (or hard-delete)
   ▼
- Future logins: DB allowlist check (gate b) fails → DENY.
- Existing sessions: revoked immediately via session-version bump (§3.6).
- Server-side OAuth tokens for that user are revoked + purged.
- AuditLog row written (actor=admin, action=user.deactivate).
```

---

## 3. Session management

Sessions are **server-side and opaque**. The browser holds nothing sensitive.

### 3.1 Store

| Option | Use |
|---|---|
| **Redis (preferred)** | Primary session store + idle-timeout TTLs + rate-limit counters. (ElastiCache, private subnet.) |
| **Postgres (fallback)** | `sessions` table when Redis is not provisioned. Same semantics, TTL via expiry column + sweep. |

The session record holds: `sessionId` (opaque, ≥128-bit random), `userId`, `sessionVersion`, `createdAt`, `lastSeenAt`, `absoluteExpiry`, `ip`, `userAgent`, and a **server-side reference** to the OAuth `access_token` / `refresh_token`.

### 3.2 Cookie (the only thing the browser holds)

```
Set-Cookie: sid=<opaque-random>;
            HttpOnly;            ← JS cannot read it (XSS-resistant)
            Secure;              ← HTTPS only
            SameSite=Lax;        ← CSRF mitigation (Strict for admin paths)
            Path=/;              ← scoped
            Max-Age=<rolling>;   ← rolling expiry
```

- **No JWT, no tokens, no role, no PII in cookies or `localStorage`/`sessionStorage`.** The cookie value is a meaningless opaque id; all meaning lives server-side.
- OAuth `access`/`refresh` tokens are stored **server-side only**, encrypted at rest (KMS, §8). They are never sent to the browser.

### 3.3 Timeouts

| Timeout | Default | Behavior |
|---|---|---|
| **Idle** | 30 min | No activity → session invalidated. Tracked via `lastSeenAt` / Redis TTL. |
| **Rolling** | per request | Each authenticated request refreshes the idle window (and cookie `Max-Age`). |
| **Absolute** | 12 h | Hard cap regardless of activity → re-authenticate with Google. |

### 3.4 Token refresh (server-side)

When the Google `access_token` nears expiry, the **server** uses the stored `refresh_token` to obtain a new one and updates the server-side record. The browser is never involved and never sees a token.

### 3.5 CSRF protection

State-changing requests (`POST/PUT/PATCH/DELETE`) are protected by **two** mechanisms:

1. **`SameSite` cookie** (Lax/Strict) — blocks most cross-site cookie attachment.
2. **Double-submit / synchronizer token** — the API issues a CSRF token; the client echoes it in a header (`X-CSRF-Token`); the server compares it to the session-bound value. Origin/Referer is also checked for sensitive endpoints.

### 3.6 Revocation & "log out everywhere"

```
Logout:              DELETE session(sid) from store; clear cookie; revoke OAuth tokens; audit.
Log out everywhere:  UPDATE users.sessionVersion += 1
                     → every existing session whose stored version < current is invalidated
                       on its next request. Used on suspension, role change, suspected compromise.
```

### 3.7 Clock skew & replay protection

- **Clock skew:** ID-token `exp`/`iat`/`nbf` validated with ≤ 60s leeway; ECS tasks sync via Amazon Time Sync.
- **Replay:** OIDC `nonce` + `state` are single-use and bound to the originating request; reused/forged values are rejected. Session ids are high-entropy and non-guessable; cookie theft is mitigated by `HttpOnly`/`Secure`/short idle window + version bump on suspicion.

---

## 4. Authorization / RBAC — role × scope

Authorization answers **two** questions independently: *what may this role do?* (action) and *to which records?* (scope). They are combined in a single policy function and enforced at three layers, server-side.

### 4.1 Roles (FIVE)

| Role | Authority |
|---|---|
| **Admin** | Global. Everything, including system configuration and audit logs. |
| **LCC** | Global read + coordination (concerns, emails, analytics). No system config. |
| **Teacher** | One or **more** academic domains (teachers can span multiple domains). |
| **Mentor** | Assigned team + mentees. **The Student Mentor leads the team** (mentee-management *and* team-delivery). |
| **Mentee** | Self only. |

> ⚠️ **Callout — Team Lead is NOT a 6th role.** A refactor prompt re-listed **"Team Lead"** as a sixth role, but a **prior product decision merged Team Lead into the Mentor**: the **Student Mentor leads the team**, holding both mentee-management and team-delivery permissions. **This system uses 5 roles.** Re-adding Team Lead later is a **small config change** (one role entry + matrix column + a `scopeWhere` branch) **if and only if** the product owner explicitly confirms it. Until then, do not implement a 6th role.

### 4.2 Scope hierarchy

```
GLOBAL                         (Admin, LCC)              all records
  ⊃ DOMAIN:<id>                (Teacher)                 records under a domain (≥1 per teacher)
       ⊃ TEAM:<id>             (Mentor)                  records under an assigned team
            ⊃ SELF             (Mentee)                  records the user owns
```

`GLOBAL ⊇ DOMAIN ⊇ TEAM ⊇ SELF`, matched by id. A user may hold **multiple scoped roles**; effective access = **union** of scopes for the action's required permission. (A teacher with two domains → `DOMAIN:1 ∪ DOMAIN:2`.)

### 4.3 Full permission matrix (resource:action × 5 roles)

Legend: ✅ full/global · 🔵 scoped (own assigned domain/team/self) · 👁 read-only · ➖ none

| `resource:action` | Admin | LCC | Teacher | Mentor | Mentee |
|---|:--:|:--:|:--:|:--:|:--:|
| `user:create` / `user:import` | ✅ | ➖ | ➖ | ➖ | ➖ |
| `user:deactivate` | ✅ | ➖ | ➖ | ➖ | ➖ |
| `role:assign` | ✅ | ➖ | ➖ | ➖ | ➖ |
| `domain:manage` | ✅ | 👁 | 🔵(own) | ➖ | ➖ |
| `team:manage` | ✅ | 🔵 | 🔵(domain) | 👁(own) | 👁(own) |
| `config:edit` (phases/gates/cycles/thresholds/rubrics) | ✅ | ➖ | 🔵(domain rubric) | ➖ | ➖ |
| `menteeUpdate:submit` (L1) | ➖ | ➖ | ➖ | ➖ | 🔵 |
| `mentorStatus:submit` (L2) | ✅ | 👁 | 👁 | 🔵 | ➖ |
| `weeklyReview:l3Submit` | ✅ | 👁 | 👁 | 🔵 | ➖ |
| `weeklyReview:l4Submit` | ✅ | 👁 | 🔵 | 👁 | ➖ |
| `gate:decide` | ✅ | 👁 | 🔵 | ➖ | ➖ |
| `review:read` | ✅ | 👁 | 🔵(domain) | 🔵(team) | 🔵(self) |
| `feedback:submit` (360°) | ➖ | 👁 | 👁 | 🔵 | 🔵 |
| `task:assign` | ✅ | 🔵 | 🔵 | 🔵 | ➖ |
| `deliverable:review` | ✅ | 👁 | 🔵 | 🔵 | ➖ |
| `deliverable:submit` | ➖ | ➖ | ➖ | 🔵 | 🔵 |
| `concern:raise` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `concern:triage` / `concern:resolve` | ✅ | ✅ | 🔵(domain) | ➖ | ➖ |
| `concern:readAnonymous` | ✅ | ✅ | ➖ | ➖ | ➖ |
| `email:send` / `email:bulkSend` | ✅ | ✅ | 🔵(domain) | 🔵(team) | ➖ |
| `emailTemplate:manage` | ✅ | 🔵 | ➖ | ➖ | ➖ |
| `analytics:global` | ✅ | ✅ | ➖ | ➖ | ➖ |
| `analytics:domain` | ✅ | ✅ | 🔵 | ➖ | ➖ |
| `analytics:team` | ✅ | ✅ | 🔵 | 🔵 | ➖ |
| `performanceMetric:read` | ✅ | 👁 | 🔵(domain) | 🔵(team) | 🔵(self) |
| `auditLog:read` | ✅ | 👁(scoped) | ➖ | ➖ | ➖ |
| `integration:manage` | ✅ | 👁 | ➖ | ➖ | ➖ |
| `config:system` (KMS/secrets/feature flags) | ✅ | ➖ | ➖ | ➖ | ➖ |

### 4.4 The `can()` policy function

```ts
// server/authz/policy.ts — the single decision point
can(user: AuthContext, action: Permission, resource?: Resource): boolean
```

```
Step 1 — ROLE check    : does any of user.roles grant `action`?           else → false
Step 2 — SCOPE check   : if `resource` given, does the granting role's
                         scope cover it?  GLOBAL ⊇ DOMAIN ⊇ TEAM ⊇ SELF,
                         matched by id (union across the user's roles)      else → false
Step 3 — OWNERSHIP     : for SELF actions, resource.ownerId === user.id     else → false
                         for DOMAIN/TEAM, resource.domainId/teamId ∈ user's assigned set
Return true only if all applicable steps pass.
```

The **same** `can()` is called by the server (authoritative) and by the UI (hint only — never trusted; the server re-decides every time).

### 4.5 Three-layer enforcement (defense in depth)

```
Request (cookie sid)
  │
  ▼
LAYER 1 — Route gate (Express middleware)
  │  authenticate(sid) → AuthContext; is this route allowed for the role?   ──▶ 401/403
  ▼
LAYER 2 — Policy check
  │  zod.validate(input)                                                     ──▶ 400
  │  can(ctx, action, resource)                                             ──▶ 403
  ▼
LAYER 3 — DB-query scoping
  │  service.method(ctx, …) where every query is wrapped in scopeWhere(ctx) ──▶ rows
  │  → out-of-scope rows are physically unreachable even if layers 1–2 had a bug
  ▼
  audit(ctx, action, before/after)  →  typed response (no internal leakage)
```

### 4.6 Authorization-flow diagram (decision)

```
            ┌──────────────────────┐
 request ──▶│ valid session? (sid) │──no──▶ 401
            └──────────┬───────────┘
                       │ yes
            ┌──────────▼───────────┐
            │ route allowed for    │──no──▶ 403
            │ role? (gate)         │
            └──────────┬───────────┘
                       │ yes
            ┌──────────▼───────────┐
            │ input valid? (zod)   │──no──▶ 400
            └──────────┬───────────┘
                       │ yes
            ┌──────────▼───────────┐
            │ can(user,action,res) │──no──▶ 403
            └──────────┬───────────┘
                       │ yes
            ┌──────────▼───────────┐
            │ scopeWhere filters   │──▶ only in-scope rows
            │ the DB query         │
            └──────────┬───────────┘
                       ▼
                audit + response
```

### 4.7 Worked isolation examples

- **Teacher (multi-domain):** a teacher assigned to domains `{7, 9}` listing students → `scopeWhere` resolves to `{ team: { domainId: { in: [7,9] } } }`. Students in domain `12` are unreachable. Teachers **can span multiple domains** — the filter is `in`, not `=`.
- **Mentor:** listing reviews → `{ menteeId: { in: assignedMenteeIds(me) } }` (i.e. `TEAM:<assignedTeamId>`). Mentees on other teams are unreachable. The Student Mentor also sees team-delivery resources for **their** team only.
- **Mentee:** listing tasks/reviews/feedback → `{ ownerId: me }` (SELF). Cannot see anyone else's records.
- **Admin:** `GLOBAL` → no scope filter.

---

## 5. Data isolation (query-level scoping)

Authorization is **not** only a route check. **Every** service method injects the caller's scope into the SQL/ORM query, so a logic bug elsewhere still cannot return out-of-scope rows.

```ts
// server/authz/scope.ts — returns the Prisma `where` for the caller's highest applicable scope
function listTeams(ctx: AuthContext) {
  return prisma.team.findMany({
    where: scopeWhere(ctx, {
      global: {},                                            // Admin / LCC
      domain: { domainId: { in: ctx.assignedDomainIds } },   // Teacher (multi-domain)
      team:   { id: { in: ctx.assignedTeamIds } },           // Mentor
      self:   { members: { some: { userId: ctx.userId } } }, // Mentee
    }),
  });
}
```

```ts
// Reviews — a Mentor physically cannot read another team's reviews
function listReviews(ctx: AuthContext) {
  return prisma.review.findMany({
    where: scopeWhere(ctx, {
      global: {},
      domain: { team: { domainId: { in: ctx.assignedDomainIds } } },
      team:   { menteeId: { in: ctx.assignedMenteeIds } },
      self:   { menteeId: ctx.userId },
    }),
  });
}
```

- **Domain isolation:** `domainId ∈ assignedDomainIds`. Cross-domain reads are impossible at the query layer.
- **Team isolation:** `teamId ∈ assignedTeamIds`. Cross-team reads impossible.
- **Ownership checks:** for `SELF` actions and for mutations, the service re-verifies `resource.ownerId === ctx.userId` before write — preventing IDOR even on direct-id access (`GET /reviews/:id`).

`scopeWhere()` selects the **highest applicable scope** for the caller and **always** applies a filter (default deny: an unrecognized scope yields an impossible `WHERE` clause, not an open one).

---

## 6. Multi-tenant AWS account isolation / blast-radius containment

> **This account also runs OTHER unrelated services.** This platform must have **ZERO blast radius** into them. "Lateral movement into other tenants' services in the shared account" is treated as an **explicit, first-class threat.** See [`infra-ecs.md`](./infra-ecs.md) for the concrete Terraform.

### 6.1 Isolation map

```
AWS Account (shared)
│
├── ▓▓▓ Forge boundary ▓▓▓ (dedicated, tagged app=forge)
│   │
│   ├── Dedicated VPC (own CIDR)            ── no peering, no Transit GW to other VPCs
│   │   ├── Public subnets   → ALB only
│   │   ├── Private subnets  → ECS (Next.js, Express)  [no public IPs]
│   │   └── Isolated subnets → RDS, Redis              [not publicly reachable]
│   │
│   ├── Dedicated Security Groups (least privilege, §6.2)
│   ├── Dedicated IAM roles (ARN-scoped + tag-conditioned, no wildcards, §6.3)
│   ├── Dedicated KMS CMK (RDS, Secrets, EBS, S3)
│   └── Secrets Manager namespace /forge/*  (§6.4, §9)
│
└── ░░░ OTHER services ░░░  ── separate VPCs / IAM / KMS / Secrets
        ▲
        └──── UNREACHABLE from Forge: no SG rule, no IAM grant, no network path.
```

### 6.2 Dedicated security groups (least-privilege rules)

| SG | Inbound | Outbound |
|---|---|---|
| `sg-alb` | 443 from Cloudflare IP ranges only | 80/443 → `sg-ecs-web` only |
| `sg-ecs-web` (Next.js) | from `sg-alb` only | → `sg-ecs-api` only (+ 443 to NAT for OIDC/integrations) |
| `sg-ecs-api` (Express) | from `sg-ecs-web` only | → `sg-rds` (5432), `sg-redis` (6379), 443→NAT (Google/GitHub/Discord) |
| `sg-rds` | 5432 from `sg-ecs-api` only | none |
| `sg-redis` | 6379 from `sg-ecs-api` only | none |

No `0.0.0.0/0` ingress anywhere except the ALB's Cloudflare-restricted 443. **No security group references any SG outside the Forge boundary.**

### 6.3 IAM scoped to this app's ARNs + tag conditions (no wildcards)

```jsonc
// ECS task role — illustrative; NO "Resource": "*", NO "*:*" actions
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "arn:aws:secretsmanager:<region>:<acct>:secret:/forge/*",
  "Condition": { "StringEquals": { "aws:ResourceTag/app": "forge" } }
},
{
  "Effect": "Allow",
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
  "Resource": "arn:aws:kms:<region>:<acct>:key/<forge-cmk-id>"
}
```

- Task roles can read **only** `/forge/*` secrets and use **only** the Forge CMK.
- No `iam:*`, no `sts:AssumeRole` into other roles, no cross-service `s3:*`/`ec2:*` wildcards.
- Conditions pin every grant to `aws:ResourceTag/app = forge`.

### 6.4 Secrets, KMS, network

- **Secrets Manager:** all secrets under `/forge/*`; task roles cannot read other namespaces.
- **Dedicated KMS CMK** encrypts RDS, Secrets, EBS volumes, and any S3 buckets — its key policy grants decrypt **only** to Forge roles.
- **Private subnets / no public IPs** for ECS; **RDS is not publicly accessible** (no public route, isolated subnet group).
- **No VPC peering / Transit Gateway** to other services' VPCs. Egress only via NAT to named external endpoints (Google, GitHub, Discord).

> **Explicit guarantee:** a full compromise of the Forge application (RCE in the Express container) yields, at most, the Forge CMK-decryptable data and `/forge/*` secrets within the Forge VPC. It **cannot** read other services' secrets, decrypt their data, assume their IAM roles, or reach their networks. **Blast radius is contained to Forge.**

---

## 7. Application security

| Threat | Mitigation |
|---|---|
| **CSRF** | `SameSite=Lax/Strict` cookie + double-submit/synchronizer CSRF token on state-changing requests; Origin/Referer check on sensitive endpoints (§3.5). |
| **XSS** | React auto-escaping; sanitize rich text (emails/announcements/concern bodies) with an allowlist sanitizer; never `dangerouslySetInnerHTML` on user input. |
| **SQL injection** | **Prisma** parameterized queries only; no raw string-interpolated SQL with user input. |
| **Input validation** | **Zod** schema at **every** boundary (route handlers, webhooks, integration callbacks); reject unknown fields; coerce + bound types. |
| **Output encoding** | Encode on render; strip/sanitize HTML from untrusted sources; JSON responses are typed, no internal field leakage. |
| **Secure file uploads** | Type + size **allowlist**, **AV scan** before acceptance, store in S3 (KMS-encrypted), serve via **signed time-limited URLs**, never executable, never served from the app origin. |
| **Rate limiting** | Per-IP and per-user token-bucket (Redis) on auth callback + all write endpoints + webhooks; exponential backoff on abuse. |
| **Security headers** | `Content-Security-Policy` (strict, nonce-based), `Strict-Transport-Security` (HSTS, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. |
| **Webhook signature verification** | **GitHub:** verify `X-Hub-Signature-256` **HMAC** against `GITHUB_WEBHOOK_SECRET`. **Discord:** verify **Ed25519** signature against `DISCORD_PUBLIC_KEY`. Reject on mismatch + reject replays (timestamp/id dedupe). See [`integration-setup.md`](./integration-setup.md). |
| **SSRF** | Integration calls go to **fixed, allowlisted** provider hosts only; no user-supplied URLs are fetched server-side; egress restricted by SG/NAT to named endpoints (§6.2). |

---

## 8. Data security

### 8.1 In transit

```
User ──TLS──▶ Cloudflare ──TLS (origin cert / mTLS)──▶ ALB ──TLS──▶ ECS (Next.js)
                                                              └─TLS─▶ ECS (Express)
Express ──TLS (sslmode=require)──▶ RDS Postgres
Express ──TLS──▶ Redis (in-transit encryption enabled)
```

TLS 1.2+ everywhere. RDS connection string enforces `sslmode=require` (verify-full where the CA is pinned).

### 8.2 At rest

- **RDS:** encrypted with the Forge **KMS CMK**.
- **Secrets Manager:** encrypted with the same CMK.
- **EBS** (ECS task ephemeral/volumes) and **S3** (uploads): CMK-encrypted.
- OAuth `access`/`refresh` tokens and integration credentials: encrypted at rest server-side.

### 8.3 PII handling, anonymized concerns, retention

- **PII access** (student/mentor identities, performance metrics, feedback) is gated by RBAC scope (§4–§5).
- **Anonymous concerns:** `Concern.anonymous = true` strips reporter identity from all reads except Admin/LCC under `concern:readAnonymous`; raiser identity is not stored against the visible record.
- **Retention:** configurable windows per data class; expired records purged/anonymized by a scheduled job; audit logs retained per policy.

---

## 9. Secrets management

- **AWS Secrets Manager**, namespaced under **`/forge/*`** (e.g. `/forge/db`, `/forge/google-oidc`, `/forge/github`, `/forge/discord`, `/forge/session`).
- **Rotation** enabled (DB credentials, integration secrets) via Secrets Manager rotation.
- **Injected into ECS tasks** at runtime (task definition `secrets:` → env), read via the ARN-scoped task role (§6.3). **Never** baked into images or committed env files in prod.
- Local dev uses git-ignored `.env`; **only `NEXT_PUBLIC_*`** variables ever reach the browser bundle — server secrets (OIDC client secret, webhook secrets, bot tokens, DB URL) are server-only. See [`integration-setup.md`](./integration-setup.md) for which keys are required.

---

## 10. Audit logging

`AuditLog` is **append-only / immutable** (insert-only table; no `UPDATE`/`DELETE` grant to the app role).

| Field | Meaning |
|---|---|
| `actorId` | who (user) — or `system` |
| `action` | e.g. `auth.login`, `user.create`, `role.assign`, `concern.resolve` |
| `entityType` / `entityId` | what was affected |
| `before` / `after` (JSON) | state delta |
| `ip` / `userAgent` | request origin |
| `ts` | server timestamp |

**Tracked events:** login / logout (and OIDC denials), role & permission/scope changes, user CRUD + de-provisioning, concern actions (raise/triage/resolve, incl. anonymous), email sends / bulk sends / template changes, integration connect/disconnect, config changes, and all admin actions.

Audit writes happen in the **service layer** (the last step of the request lifecycle, §4.5), so no privileged action can bypass logging. Admin → Audit Logs reads with filters (actor, action, entity, date).

---

## 11. Threat model (STRIDE-style)

| # | Threat (STRIDE) | Vector | Mitigation |
|---|---|---|---|
| 1 | **Stolen session cookie** (Spoofing) | XSS / device theft / network sniff | `HttpOnly` + `Secure` + `SameSite`; opaque high-entropy id; idle + absolute timeouts; `sessionVersion` bump to mass-revoke; TLS everywhere. |
| 2 | **OAuth replay / code interception** (Spoofing/Tampering) | Reused `code`/`id_token`, forged callback | PKCE; single-use `state` + `nonce`; full ID-token validation (sig/iss/aud/exp/nonce); HTTPS callback only. |
| 3 | **Privilege escalation / IDOR across domains/teams** (Elevation) | Tampered ids, forced browsing `GET /reviews/:id` | Three-layer authz; `can()` + ownership re-check; **`scopeWhere` on every query** → out-of-scope rows physically unreachable. |
| 4 | **Forged login / unknown user** (Spoofing) | Valid Google user not provisioned, wrong domain | **Dual gate:** `hd` claim **AND** DB allowlist; `random@gmail.com` and unprovisioned institution emails both rejected. |
| 5 | **Webhook spoofing** (Spoofing/Tampering) | Fake GitHub/Discord payloads | GitHub HMAC + Discord Ed25519 signature verification; replay dedupe; Zod validation. |
| 6 | **Secret leakage** (Information disclosure) | Secrets in images / client bundle / logs | Secrets Manager `/forge/*` injected at runtime; only `NEXT_PUBLIC_*` to browser; KMS at rest; secrets scrubbed from logs; rotation. |
| 7 | **SSRF from integrations** (Tampering/Info disclosure) | User-supplied URL fetched server-side | No user-controlled outbound fetch; allowlisted provider hosts only; egress restricted via SG/NAT to named endpoints. |
| 8 | **Supply chain** (Tampering) | Malicious/compromised dependency | Pinned lockfiles, SCA scanning, image scanning, minimal base images, least-privilege task role limits impact. |
| 9 | **Lateral movement into OTHER AWS services in the shared account** (Elevation) | RCE in container → pivot to co-tenant services | **Dedicated VPC/SG/IAM/KMS/Secrets**, ARN-scoped + tag-conditioned IAM (no wildcards), no VPC peering, RDS not public → **zero blast radius** (§6). |
| 10 | **DoS / brute force** (Denial of service) | Flood auth / write / webhook endpoints | Cloudflare WAF + DDoS; per-IP/user rate limiting (Redis); ALB; autoscaling. |
| 11 | **Repudiation** (Repudiation) | "I didn't do that" | Immutable `AuditLog` with actor/action/before/after/ip/ts written in the service layer. |
| 12 | **Data exfiltration at rest** (Info disclosure) | Stolen snapshot / volume | KMS CMK encryption (RDS/Secrets/EBS/S3); CMK key policy limited to Forge roles. |

---

## 12. Compliance & future

- **MFA:** **inherent** — Google/Workspace accounts enforce the institution's 2FA. No separate MFA to build.
- **SSO:** **already Google** (OIDC). Additional providers (Microsoft/other Workspace orgs) would be additive, behind the same dual-gate allowlist.
- **Fine-grained permissions (future):** the permission set is data-extensible (`resource:action` strings); new permissions and scopes slot into the matrix + `can()` without rewrites.
- **Re-adding Team Lead (future):** small config change (§4.1) — only if the product owner confirms; default remains 5 roles.
- **Security audits / compliance (future):** immutable audit log, scoped access, encryption, and account isolation are already in place to support external review and penetration testing.

---

> See also: [`architecture-v2.md`](./architecture-v2.md) · [`infra-ecs.md`](./infra-ecs.md) · [`integration-setup.md`](./integration-setup.md).
