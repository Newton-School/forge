# Architecture — Profile Building Drive Management Platform (PBDMP)

> Companion docs: [ui-ux.md](./ui-ux.md) · [security-rbac.md](./security-rbac.md) · [setup-guide.md](./setup-guide.md) · [integration-setup.md](./integration-setup.md)
> Product spec: [02_Platform_PRD.md](./02_Platform_PRD.md) · Source analysis: [01_RawDocs_Analysis_Report.md](./01_RawDocs_Analysis_Report.md)

This document is the engineering blueprint. It is implementation-agnostic about *when* things are built; it defines *how* the system is structured. **Phase 1 (current) = UI, design system, layouts, navigation, mock data.** No route middleware, no live auth enforcement, no heavy backend yet — but the architecture below is designed so those can be added in later phases **without refactoring**.

---

## 1. System Architecture

### 1.1 Shape: a serverless monolith on Vercel Free Tier

The platform is a **single Next.js 16 application** (App Router) deployed to Vercel. There are no separate backend services, no background workers, no message queues, and (initially) no Redis. Everything — UI, API, server actions, integration calls — runs inside one deployable unit, executed as **serverless/edge functions** on demand.

```
┌──────────────────────────────────────────────────────────────────┐
│                     Vercel (single Next.js 16 app)                 │
│                                                                    │
│   ┌────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│   │  React 19   │   │  Route        │   │  Server Actions      │    │
│   │  Server +   │──▶│  Handlers     │   │  (mutations, forms)  │    │
│   │  Client     │   │  /app/api/**  │   │                      │    │
│   │  Components │   └──────┬───────┘   └─────────┬────────────┘    │
│   └────────────┘          │                      │                 │
│         │                 ▼                      ▼                 │
│         │          ┌─────────────────────────────────────┐        │
│         │          │   Service / Policy / Data layer       │        │
│         │          │  (lib/services, lib/auth, lib/rbac)   │        │
│         │          └───────────────┬─────────────────────┘        │
│         │                          ▼                              │
│         │                   ┌──────────────┐                       │
│         │                   │ Prisma Client │                      │
│         │                   └──────┬───────┘                       │
└─────────┼──────────────────────────┼──────────────────────────────┘
          │                          ▼
          │                 ┌──────────────────┐
          │                 │  Neon Postgres   │  (serverless, pooled)
          │                 └──────────────────┘
          ▼
   External APIs (called on-demand from route handlers / actions):
   GitHub REST/Webhooks · Discord REST/Bot · Google Calendar · Groq · SMTP (Nodemailer)
```

### 1.2 Why this shape (Vercel Free Tier constraints)

| Constraint | Design response |
|---|---|
| No long-running processes | Every unit of work is a short-lived serverless invocation; nothing holds a socket open. |
| No background workers | Deferred work is done **on-read** (compute when a dashboard loads) or via **on-demand sync endpoints** triggered by user action / webhook, not a daemon. |
| No Redis initially | Sessions use **stateless JWT cookies** (no server session store). Caching uses Next.js `fetch` cache + React `cache()` + Postgres rollup tables. |
| Cron-light | Vercel Cron (free: limited) is used sparingly — at most a daily rollup/flag job. Real-time signals come from **inbound webhooks**, not polling loops. |
| No microservices | One repo, one deploy, one database. Modules are **logical**, not network boundaries. |
| Serverless DB connections | **Neon** pooled connection string + Prisma; connections are short-lived and pooled to survive serverless cold starts. |

### 1.3 Database connection strategy (Neon + Prisma + serverless)

- Use Neon's **pooled** connection (`-pooler` host, already present in `.env`) for the app runtime to avoid exhausting connections across many concurrent lambdas.
- Use the **direct** (non-pooled) URL for Prisma **migrations** only.
- `.env` keys: `DATABASE_URL` (pooled, runtime) + `DIRECT_URL` (direct, migrations). *(The current `.env` uses `DB_URL`; standardize to `DATABASE_URL` — see [.env.example](../.env.example).)*

---

## 2. Module Breakdown

The PRD decomposes into these **logical modules**. Each maps to a route group, a service file, and a slice of the schema.

| # | Module | Responsibility | Primary entities |
|---|---|---|---|
| M1 | **Identity & Access** | Users, roles, scopes, invitations, password lifecycle, sessions | `User`, `Role`, `UserRole`, `Invitation`, `PasswordReset`, `Session` |
| M2 | **Org Structure** | Drives, domains, teams, squads, membership, assignments | `Drive`, `Domain`, `Team`, `Squad`, `TeamMember` |
| M3 | **Drive Configuration** | Phases, gates, review cycles, escalation rules, rubrics, deliverable types | `Phase`, `Gate`, `ReviewCycle`, `EscalationRule`, `Rubric`, `RubricDimension`, `DeliverableType` |
| M4 | **Projects & Work** | Group/individual projects, milestones, tasks, deliverables, skills | `Project`, `Milestone`, `Task`, `Deliverable`, `SkillAssessment` |
| M5 | **Reviews (L1–L4)** | Mentee updates, mentor status, weekly reviews, 360° feedback, mentorship logs, evaluations, attendance | `MenteeUpdate`, `MentorStatus`, `WeeklyReview`, `MentorFeedback`, `MentorshipLog`, `Evaluation`, `Attendance` |
| M6 | **Concerns** | Raise, triage, lifecycle, SLA, escalation, demerits | `Concern`, `ConcernEvent`, `Demerit` |
| M7 | **Communications** | Email center, templates, announcements, notifications, rules | `EmailTemplate`, `Email`, `Announcement`, `Notification`, `NotificationRule` |
| M8 | **Integrations** | GitHub, Discord, Google Calendar accounts + activity | `IntegrationAccount`, `GithubActivity`, `DiscordActivity`, `CalendarEvent` |
| M9 | **Analytics & Reporting** | Rollups, KPI surfaces, exports | `*Rollup` tables, report generators |
| M10 | **AI Assist (Groq)** | PRD assistant, review summaries, feedback suggestions, analytics insights | (stateless; reads existing entities) |
| M11 | **Audit** | Immutable log of privileged/mutating actions | `AuditLog` |

> Modules are **logical**. They share one Prisma client and one process. The boundary is enforced by the **service layer** (`lib/services/*`) and **policy layer** (`lib/rbac`), not by the network.

---

## 3. Folder Structure

Root-relative `@/*` alias (matches `tsconfig.json` → `"@/*": ["./*"]`). **No `src/` directory** (this scaffold puts `app/` at root).

```
portal/
├── app/
│   ├── (auth)/                      # unauthenticated routes, minimal layout
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── first-login/page.tsx     # forced password change
│   ├── (app)/                       # authenticated shell (sidebar + topnav)
│   │   ├── layout.tsx               # AppShell: Sidebar + TopNav + content
│   │   ├── admin/                   # M1,M2,M3,M8,M7,M11
│   │   │   ├── page.tsx             # admin overview
│   │   │   ├── users/…
│   │   │   ├── domains/…
│   │   │   ├── teams/…
│   │   │   ├── roles/…
│   │   │   ├── configuration/…      # phases, gates, review cycles, thresholds, rubrics
│   │   │   ├── integrations/…
│   │   │   ├── email-templates/…
│   │   │   └── audit-logs/…
│   │   ├── lcc/                     # global monitoring, concerns, email center
│   │   ├── teacher/                 # domain-scoped
│   │   ├── mentor/                  # mentee-scoped
│   │   ├── team-lead/               # team-scoped
│   │   ├── mentee/                  # self-scoped
│   │   └── shared/                  # concerns, notifications, profile (cross-role)
│   ├── api/                         # Route Handlers (Phase 3) — thin, call services
│   │   ├── auth/… github/… discord/… calendar/… webhooks/…
│   ├── layout.tsx                   # root layout (html/body, fonts, providers)
│   ├── globals.css                  # Tailwind v4 @theme tokens
│   └── page.tsx                     # → redirect to role dashboard or /login
│
├── components/
│   ├── ui/                          # shadcn-style primitives (Button, Card, Table…)
│   ├── layout/                      # Sidebar, TopNav, AppShell, Breadcrumbs, RoleSwitcher(dev)
│   ├── dashboard/                   # StatCard, DataTable, PageHeader, EmptyState, ChartCard…
│   ├── concerns/                    # ConcernTimeline, ConcernStatusBadge, RaiseConcernDialog
│   ├── reviews/                     # UpdateForm, MentorReviewCard, WeeklyReviewQueue
│   ├── integrations/                # GithubActivityFeed, DiscordPanel, CalendarList
│   ├── email/                       # ComposeEmail, TemplateEditor, RecipientPicker
│   └── ai/                          # AiAssistPanel (Groq)
│
├── lib/
│   ├── auth/                        # auth.config.ts, session helpers (Phase 3 wires Auth.js)
│   ├── rbac/                        # roles.ts, permissions.ts, policy.ts, scope.ts
│   ├── services/                    # one file per module: userService, concernService…
│   ├── db/                          # prisma client singleton
│   ├── nav/                         # nav.config.ts (role → menu tree)
│   ├── mock/                        # mock data for Phase 1 (users, teams, concerns…)
│   ├── ai/                          # groq client + prompt templates (modular)
│   ├── types.ts                     # shared TS types / enums mirrored from Prisma
│   └── utils.ts                     # cn(), formatters, date helpers
│
├── prisma/
│   └── schema.prisma                # full data model (design artifact this phase)
│
├── docs/                            # this folder
├── components.json                  # shadcn config (manual)
└── .env.example
```

### 3.1 Route-group rationale
- `(auth)` and `(app)` are **layout groups** — they don't affect URLs, they swap the chrome (bare vs. sidebar shell).
- Role folders (`admin/`, `mentor/`, …) keep **page files physically separated by role**, which is what makes both parallel development and (Phase 3) route-level RBAC clean: a single `proxy.ts` rule can gate `/(app)/admin/**` to `Admin`.

---

## 4. Routing & Rendering Model (Next.js 16 specifics)

This is **not** the Next.js most training data assumes. Conventions used here:

- **App Router only.** Server Components by default; `"use client"` only for interactivity (forms, dropdowns, charts).
- **Async dynamic APIs.** `params` and `searchParams` are **Promises** — pages destructure via `const { id } = await params`. Same for `cookies()`, `headers()`, `draftMode()`.
- **Turbopack is the default** bundler for `dev` and `build` (no `--turbopack` flag needed).
- **`middleware.ts` is renamed to `proxy.ts`.** We are **not** adding it in Phase 1. When we do (Phase 3), route protection lives in `proxy.ts`.
- **Server Actions** for mutations (forms, status changes) — colocated `actions.ts` per route folder, calling the service layer.
- **Data fetching** in Server Components via `await service.x()` (Phase 1: services return mock data; Phase 3: Prisma).
- **Caching:** rely on Next's segment cache + `cache()` for per-request memoization; analytics read from rollup tables, never recompute on the hot path.

---

## 5. API Structure (Phase 3 — designed now)

Two complementary mutation/read mechanisms:

1. **Server Actions** (preferred for first-party UI): form submissions, status transitions, CRUD from dashboards. Type-safe, no manual fetch, CSRF-protected by Next.
2. **Route Handlers** (`app/api/**`) for: webhooks (GitHub/Discord), OAuth callbacks, cron targets, and any machine-to-machine or external-consumer endpoint.

**Contract conventions** (both paths):
- Every handler/action: `authenticate()` → `authorize(policy, resource)` → `validate(zodSchema)` → `service.call()` → `audit()` → typed result.
- Errors are typed (`AppError` with `code`, `httpStatus`, `safeMessage`); never leak internals.
- All list reads are **scope-filtered at the query level** (see §7).

Representative endpoints are catalogued in the PRD §13; the canonical list lives alongside each service.

---

## 6. Data Architecture

The full schema is in [`prisma/schema.prisma`](../prisma/schema.prisma). Highlights:

- **Multi-tenant by `driveId`** — every operational record belongs to a `Drive`, enabling multiple cohorts and clean archival.
- **Scoped hierarchy**: `Drive → Domain → Team → TeamMember(User)`; `Domain.teacherId`, `Team.mentorId`, `Team.teamLeadId` carry the assignment edges that RBAC scopes resolve against.
- **Configuration as data** (M3): phases, gates, review cadences, escalation thresholds, and rubric weights are **rows**, not constants — fulfilling the PRD's "dynamic, admin-managed" mandate.
- **Append-only review trail**: `MenteeUpdate` (L1), `MentorStatus` (L2), `WeeklyReview` (L3+L4) are never deleted; analytics roll up from them.
- **Audit everything**: `AuditLog` captures actor, action, before/after JSON, IP, timestamp.
- **Enums** mirror the exact tracking-sheet vocabulary (`Doing Well`/`Needs Consistency`/`No Updates 4+ Days`, `On Track`/`At Risk`/`Needs Discussion`, `Continue`/`Monitor`/`Schedule Discussion`, concern statuses, etc.).

---

## 7. RBAC Design (summary — full detail in [security-rbac.md](./security-rbac.md))

RBAC is **two-dimensional**: `(role) × (scope)`.

- **Role** — one of `ADMIN, LCC, TEACHER, MENTOR, MENTEE`. Defines *what kinds of actions* are permitted (a permission set). *(The Student **Mentor** leads their team — there is no separate Team Lead role; team-delivery tools live in the Mentor area.)*
- **Scope** — `GLOBAL | DOMAIN:<id> | TEAM:<id> | SELF`. Defines *which records* the role may touch.

Authorization is a **policy function**: `can(user, action, resource) → boolean`, evaluated **server-side on every request**. The UI uses the same predicates to hide controls, but the **server is the boundary** — frontend hiding is never the gate.

**Data isolation is enforced at the query layer**: every service method takes the caller's `AuthContext` and injects scope filters into the Prisma query (e.g., a Teacher's team query is always `where: { domain: { teacherId: ctx.userId } }`). A Teacher physically cannot select another domain's rows.

Phase 1 ships the **RBAC config, permission matrix, policy functions, and scope resolvers** as code (`lib/rbac/*`) and uses them for **UI rendering only**. Phase 3 wires the same functions into `proxy.ts` (route gate) and every service (query gate) — **no refactor**, just activation.

---

## 8. Authentication Architecture — Evaluation & Recommendation

The brief asked for a justified choice between **NextAuth/Auth.js**, **Custom JWT**, and a **Hybrid Session+JWT** approach.

### 8.1 Options compared

| Criterion | Custom JWT | Auth.js (NextAuth v5) | Hybrid (DB session + JWT) |
|---|---|---|---|
| Serverless / Vercel fit | ✅ stateless | ✅ stateless (JWT strategy) | ⚠️ needs session store (Redis/DB) on every request |
| Security defaults (CSRF, cookie flags, rotation) | ❌ hand-rolled, error-prone | ✅ built-in, audited | ✅ built-in |
| Credentials (email+password) support | ✅ | ✅ (Credentials provider) | ✅ |
| RBAC claims in token | ✅ manual | ✅ via `jwt`/`session` callbacks | ✅ |
| Future SSO (Google/Microsoft/University) | ❌ build each by hand | ✅ add a provider, minimal change | ✅ |
| MFA extensibility | ⚠️ manual | ✅ callback/adapter hooks | ✅ |
| Maintenance burden | High | Low | Medium |
| Free-tier cost | $0 | $0 | $0 but extra round-trips |

### 8.2 Recommendation — **Auth.js v5 (NextAuth) with the JWT session strategy + Prisma adapter for the user store, Credentials provider, Argon2id hashing.**

This is a *pragmatic hybrid*: **Auth.js owns the session/cookie/CSRF machinery** (so we don't hand-roll security-critical code), the **session is a stateless JWT** in an `httpOnly`, `Secure`, `SameSite=Lax` cookie (so it's perfectly serverless — no per-request session store, no Redis, ideal for Vercel free tier), and the **Prisma adapter** persists users/accounts so SSO providers can be bolted on later.

**Why not pure custom JWT:** re-implementing CSRF protection, secure cookie handling, token rotation, and provider plumbing is exactly the class of work where subtle security bugs appear. For a platform holding sensitive academic data, we delegate that to an audited library.

**Why not DB sessions:** they add a database read to *every* authenticated request — needless latency and connection pressure on a serverless/free-tier deployment, with no benefit our threat model requires. (We can revisit if instant server-side session revocation becomes a hard requirement; until then, short token lifetimes + a `tokenVersion` claim give us revocation without per-request DB hits.)

### 8.3 How RBAC rides on the token (designed now, wired in Phase 3)

```
login (Credentials, Argon2id verify)
        │
        ▼
jwt() callback ── embeds: { sub, role, scopes[], tokenVersion, mustChangePassword }
        │
        ▼
session() callback ── exposes typed session.user to server components/actions
        │
        ▼
every request: getAuthContext() reads the token  → can(user, action, resource)
                                                  → sensitive ops re-check DB (tokenVersion, status)
```

- **`tokenVersion`** (stored on `User`) lets us invalidate all sessions for a user (password change, role change, suspension) by bumping the column — checked on sensitive operations without a per-request session table.
- **`mustChangePassword`** forces the first-login flow.
- Short access-token lifetime (e.g., 30–60 min) with rolling refresh via Auth.js.

> **Phase 1 note:** none of this is enforced yet. `lib/auth/` ships the **config and types** and a dev-only **role switcher** so every dashboard can be previewed. The login UI is built but posts to a stub. No `proxy.ts` is added. This is intentional and matches the brief.

---

## 9. AI (Groq) Architecture

- **Single client** in `lib/ai/groq.ts`; **prompts are modular templates** in `lib/ai/prompts/` (one per capability: `prdAssistant`, `reviewSummary`, `feedbackSuggestion`, `analyticsInsight`).
- **Stateless & on-demand**: invoked only from a user action (button), never on a schedule. Each call is a short serverless invocation.
- **Cost guards**: small models, capped `max_tokens`, input truncation, and a per-user rate limit. No autonomous/agentic loops, no embeddings store in Phase 1.
- **Boundary**: AI output is **advisory** — it drafts a review summary or suggests feedback; a human always confirms before it's persisted as official.

---

## 10. Phasing (capabilities, not dates)

| Layer | Phase 1 (now) | Phase 2 | Phase 3 |
|---|---|---|---|
| UI / design system | ✅ full | polish | — |
| Dashboards & flows (mock data) | ✅ | — | — |
| RBAC config & UI rendering | ✅ (render-only) | — | — |
| Auth enforcement (`proxy.ts`, Auth.js) | ❌ designed | — | ✅ |
| Prisma + real queries | schema only | — | ✅ |
| Server Actions / API handlers | stubs | — | ✅ |
| Integrations (GitHub/Discord/Calendar) | UI + arch | — | ✅ live |
| Email (Nodemailer) | UI only | — | ✅ send |
| Groq | arch + panel | — | ✅ live |
| Audit log | schema + UI | — | ✅ writes |

The ordering guarantees: **what you review now (designs, flows, component architecture) is the same structure that later carries enforcement** — security is designed in, not bolted on.
