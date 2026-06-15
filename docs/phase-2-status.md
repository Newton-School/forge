# Phase 2 — Backend status & the module pattern

The Express backend is **feature-complete** for Phase 2: a **production-grade, SOLID, layered foundation**, **Google-OAuth-only auth**, **server-side RBAC + audit**, **Swagger docs (67 paths / 22 tags)**, and **23 feature modules** — the full student→mentor→teacher→faculty workflow, drive configuration, analytics, notifications, email, the GitHub / Discord / Google-Calendar / Groq integrations, and the auto-flag/escalation scheduler. **66 server tests + 20 client tests, all green.** The module pattern every one of them follows is below.

## How to run it

```bash
# 1. infra (Postgres + Redis)
cd portal && docker compose up postgres redis -d

# 2. server
cd server
cp .env.example .env        # set SESSION_SECRET (openssl rand -base64 32), DATABASE_URL, Google creds
npm install
npm run prisma:generate
npm run db:migrate:dev      # creates the schema
npm run db:seed             # provisions the allowlist (admin@/teacher@/mentor@/mentee@<domain>)
npm run dev                 # http://localhost:4000

# docs:    http://localhost:4000/api/docs   (Swagger UI)
# health:  http://localhost:4000/api/health
```
Log in by visiting the client and clicking **Continue with Google** (only seeded institute emails are allowed).

## What's implemented (complete & tested)

**Foundation (`src/`)**
- `config/env.ts` — Zod-validated env, fail-fast.
- `lib/db.ts` (Prisma singleton) · `lib/logger.ts` (pino) · `lib/errors.ts` (`AppError` + `asyncHandler`) · `lib/audit.ts` (immutable audit log).
- `middleware/` — `security` (helmet, cors=client-origin, compression, rate-limit, **CSRF double-submit**), `session` (Redis-backed, Secure/HttpOnly/SameSite cookie), `passport` (Google), `auth` (`attachAuth`, `requireAuth`, `requirePermission`), `validate` (Zod), `error` (central handler, no leakage).
- `lib/openapi.ts` — the OpenAPI 3 spec served at `/api/docs`.

**RBAC (`src/rbac/`)** — `permissions` (role→permission), `policy` (`can()` + `effectiveScope()`), `scope` (`scopeWhere()` → Prisma filter). Enforced at three layers: route gate → `can()` → scoped query.

**Auth — Google OAuth only (`src/modules/auth/`)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/google` | begin login (restricted to the hosted domain) |
| GET | `/api/auth/google/callback` | OIDC callback; **gate = hosted-domain AND email in the users table**; unknown → rejected |
| GET | `/api/auth/me` | current session user (RBAC context) |
| GET | `/api/auth/csrf` | read the CSRF token |
| POST | `/api/auth/logout` | destroy the session |

**Users — admin (`src/modules/users/`)** — `GET/POST /api/users`, `GET/PATCH /api/users/:id`, `POST /api/users/:id/roles`. RBAC-gated, Zod-validated, audited.

**Org — read + write (`src/modules/org/`)** — `GET/POST /api/org/domains` + `PATCH /api/org/domains/:id` (Admin · `domain:manage`); `GET/POST /api/org/teams` + `PATCH /api/org/teams/:id` (Admin/LCC/Teacher · `team:manage`, Teacher limited to own domain); `POST /api/org/teams/:id/members` + `DELETE /api/org/teams/:id/members/:userId`. Reads scope-filtered; writes layered (repository/service) + audited.

**Audit log — read (`src/modules/audit/`)** — `GET /api/audit` (Admin/LCC · `auditLog:read`), filterable by entityType/entityId/actorId/action, newest-first + total. The immutable writes live in `lib/audit.ts`; every privileged action across all modules appends here.

**Analytics — rollups (`src/modules/analytics/`)** — `GET /api/analytics/overview` (headline KPIs + at-risk signals · `analytics:team`), `GET /api/analytics/domains` (per-domain teams/students/mentors · `analytics:domain`), `GET /api/analytics/teams` (per-team · `analytics:team`). All scope-filtered (a Teacher sees only their domains). Pure, unit-tested aggregation in `analytics.logic.ts` (`percent`, `rollupDomains`, `totals`). Signals come from live data: open concerns, at-risk weekly reviews, pending deliverables.

**Email — outbound + announcements (`src/modules/email/`)** — `POST /api/email/send` (explicit addresses · `email:send`), `POST /api/email/bulk` (targeted, capped at 1000 · `email:bulkSend`), `GET /api/email/templates`, `POST /api/email/announcements` (in-app fan-out + optional email · `announcement:send`). Built on the **Adapter pattern**: an `EmailProvider` port with a safe **Console** adapter (default) and an **SMTP** adapter (nodemailer, lazily loaded so the build never depends on it) selected by env (`mailerConfigured`). Pure, unit-tested merge-field rendering in `email.templates.ts` (`renderTemplate`, `missingVars`). Sends are persisted (`Email` rows: DRAFT→SENT/FAILED/SCHEDULED), recipient-capped, and audited; announcements reuse the notifications producer for the in-app channel.

**GitHub integration — webhooks + activity (`src/modules/github/`)** — `POST /api/integrations/github/webhook` (**public, HMAC-verified** — mounted before the session/CSRF/auth stack since GitHub signs with `X-Hub-Signature-256`, not a cookie), `GET /api/integrations/github/activity` (scope-filtered · `review:read`), `GET /api/integrations/github/status` (`integration:manage`). The webhook ingests push/PR/issue/review events, attributes each to a team (by repo URL) and user (by GitHub login), and upserts idempotently by `externalId` (redelivery-safe). Raw request bytes are captured by the JSON parser's `verify` hook for the HMAC. Pure, unit-tested core in `github.webhook.ts` (`verifyGithubSignature` — timing-safe; `normalizeEvent`). **Live-verified**: a correctly-signed payload → `200 { recorded }`, a tampered/wrong signature → `403`.

**Discord integration — interactions + activity (`src/modules/discord/`)** — `POST /api/integrations/discord/interactions` (**public, Ed25519-verified** — mounted before the session/CSRF/auth stack; PING→PONG, other interactions recorded as activity), `GET /api/integrations/discord/activity` (scope-filtered · `review:read`), `GET /api/integrations/discord/status` (`integration:manage`). Signature verification uses Node's **native Ed25519** (`crypto.verify`, no extra dependency) over `timestamp + raw body`, attributing activity to a team (by channel id) and user (by Discord id). Pure, unit-tested core in `discord.webhook.ts` (`verifyDiscordSignature`, `normalizeInteraction`). **Live-verified**: a correctly-signed PING → `200 {type:1}`, a bad signature → `403`.

**Scheduled jobs — auto-flags / escalations (`src/modules/jobs/`)** — a dependency-free `setInterval` scheduler (`startSchedulers`, started from `index.ts`, no-op unless `JOBS_ENABLED`, overlap-guarded, `unref`'d) plus a manual trigger `POST /api/jobs/auto-flags/run` (Admin · `integration:manage`). The job loads the active drive's **escalation rules** (Config module), computes each mentee's metrics from L1 history (`daysSinceUpdate`, `blockerStreak`, `updatesThisWeek` via `reviews.metrics`), and fires rules whose threshold is met — emitting notifications **deduped per rule+user per 24h** and auditing each as a system action (actor=null). Pure, unit-tested decision logic in `jobs.logic.ts` (`evaluateEscalations`, `ruleMetricValue`, domain-scoped).

**Calendar — events + Google sync (`src/modules/calendar/`)** — `GET /api/calendar/events` (scope-filtered) and `POST /api/calendar/events` (authorized per scope). Events carry `scopeType` GLOBAL/DOMAIN/TEAM/PERSONAL; GLOBAL is drive-wide, PERSONAL is pinned to the creator. Pure, unit-tested rules in `calendar.access.ts` (`calendarReadWhere`, `canCreateEvent`). Outbound **Google Calendar** push is an Adapter (`calendar.provider.ts`): a **Local** provider (default) and a **Google service-account** provider (JWT RS256 → token → `events.insert`, fetch + node:crypto, no SDK) selected by env; the push is **best-effort** — a calendar outage never blocks creating the event locally.

**Notifications — in-app (`src/modules/notifications/`)** — `GET /api/notifications` (+ unread count), `GET /api/notifications/unread-count`, `POST /api/notifications/read-all`, `POST /api/notifications/:id/read`. All self-scoped (you only ever touch your own; mark-read is owner-constrained). The module also exposes an internal `emitNotification(userId, type, payload)` producer (best-effort, never blocks the triggering action) — wired live so **issuing a demerit notifies the affected user** (`DEMERIT_ISSUED`). Other modules adopt the same one-line call.

**Concerns — scoped lifecycle (`src/modules/concerns/`)** — `GET/POST /api/concerns`, `GET /api/concerns/:id`, `POST /api/concerns/:id/transition`. Includes an explicit, unit-tested **state machine** (`concerns.state.ts`) and query-level scope isolation.

**Reviews — the L1–L4 loop (`src/modules/reviews/`)**
| Level | Method · Path | Who |
|---|---|---|
| L1 | `POST /api/reviews/updates`, `GET /api/reviews/updates` | Mentee submits / scoped read |
| L2 | `GET /api/reviews/mentees`, `POST /api/reviews/mentor-status` | Mentor dashboard (computed metrics) + status |
| L3 | `POST /api/reviews/weekly`, `GET /api/reviews/weekly` | Mentor weekly review (upsert per mentee+week) |
| L4 | `POST /api/reviews/weekly/:id/decision` | Teacher decision (domain-scoped) |

Pure, unit-tested logic in `reviews.metrics.ts`: `blockerStreak`, `computeAutoFlag` (NO_UPDATES / REPEATED_BLOCKER / CONSISTENCY_GAP), `deriveL2Status`, `daysBetween`. The mentor dashboard computes updates-this-week, last-update, blocker-streak and days-since-update from the L1 history. *(The escalation thresholds these flags use are now data-driven via the Configuration module below.)*

**Projects — group/individual + faculty gates (`src/modules/projects/`)**
| Method · Path | Who |
|---|---|
| `GET /api/projects` | Anyone (scope-filtered) |
| `POST /api/projects` | Mentor (own team) / Teacher (domain) / Admin · `project:manage` |
| `POST /api/projects/:id/proposal-decision` | Faculty gate verdict (APPROVED / REVISE_RESUBMIT / REJECTED) · `gate:decide` |

**Tasks — assigned work (`src/modules/tasks/`)**
| Method · Path | Who |
|---|---|
| `GET /api/tasks` | Anyone (scope-filtered) |
| `POST /api/tasks` | Assign — Mentor/Teacher/Admin · `task:assign` (assignee must be on the project's team) |
| `PATCH /api/tasks/:id` | Assignee updates own progress, or a managing role updates any task in scope |

**Deliverables — submit & review (`src/modules/deliverables/`)**
| Method · Path | Who |
|---|---|
| `GET /api/deliverables` | Anyone (scope-filtered) |
| `POST /api/deliverables` | Submit an artifact URL · `deliverable:submit` |
| `POST /api/deliverables/:id/review` | Approve/reject · `deliverable:review` |

Pure, unit-tested review state machine in `deliverables.state.ts` (`canReview`, `applyReview`): only a PENDING deliverable may be reviewed; re-reviewing a terminal one is rejected (409).

**Milestones — progress & sign-off (`src/modules/milestones/`)**
| Method · Path | Who |
|---|---|
| `GET /api/milestones` | Anyone (scope-filtered) |
| `POST /api/milestones` | Create — Mentor/Teacher/Admin · `project:manage` |
| `PATCH /api/milestones/:id` | Update progress / faculty **sign-off** · `project:manage` |

Pure, unit-tested rules in `milestones.logic.ts` (`clampPct`, `deriveStatus`): status is derived from `completionPct` + sign-off (TODO → IN_PROGRESS → IN_REVIEW at 100% → DONE on sign-off); callers never set status directly.

**Feedback — 360° mentor ratings (`src/modules/feedback/`)**
| Method · Path | Who |
|---|---|
| `POST /api/feedback/mentor` | Mentee rates their own mentor · `mentorFeedback:submit` (verified mentor-of-mentee) |
| `GET /api/feedback/mentor` | Mentor sees own 360°; domain roles see their mentors' (confidential answers, audited without contents) |

**Demerits — disciplinary points (`src/modules/demerits/`)**
| Method · Path | Who |
|---|---|
| `GET /api/demerits` | Scope-filtered (subject sees own; domain/team via the subject's membership) |
| `POST /api/demerits` | Issue · `demerit:manage` (Admin/LCC) |
| `PATCH /api/demerits/:id` | Amend points/reason/escalation · `demerit:manage` (out-of-scope → 404) |

**Drive Configuration — phases / gates / cycles / escalations / rubrics (`src/modules/config/`)**
All routes require `config:edit`; a **Teacher is limited to their own domain** and cannot touch all-domain config. Each entity carries `domainId` (`null` = all domains).
| Entity | Routes |
|---|---|
| Phases | `GET/POST /api/config/phases`, `PATCH /api/config/phases/:id` |
| Gates | `GET/POST /api/config/gates`, `PATCH /api/config/gates/:id` |
| Review cycles | `GET/POST /api/config/cycles`, `PATCH /api/config/cycles/:id` |
| Escalation rules | `GET/POST /api/config/escalations`, `PATCH /api/config/escalations/:id` |
| Rubrics + dimensions | `GET/POST /api/config/rubrics`, `PATCH /api/config/rubrics/:id`, `POST /api/config/rubrics/:rubricId/dimensions`, `PATCH /api/config/dimensions/:id` |

Pure, unit-tested authorization in `config.access.ts` (`canWriteConfigScope`, `configReadWhere`): global roles write/read anything; domain roles read all-domain config + their own and may write only their own domains. Cycles are stored as a real **number + unit** (`intervalValue` + `intervalUnit` + `anchorDay`), never the text "every 2 days".

**Client wiring (these buttons now POST — presentation-safe via `lib/api.submit()`):** Mentee **Submit Update** (L1) · Mentor **Update status** (L2) · Mentor **Write/New review** (L3) · Teacher **Set decision** (L4) · Teacher faculty-gate **Approve / Revise / Reject** · Mentor **Assign Task** · Mentee **Submit Deliverable** · Mentor deliverable **Approve / Reject** · Mentee **Submit 360° Rating** · LCC **Issue demerit** / **Edit demerit** · Admin **Drive Configuration** (Add/Edit Phase · Gate · Cycle · Rule · Dimension) · Admin **Add/Edit Domain** · Admin **Add/Edit Team** · **Mark all notifications read** · LCC **Email Center** (Send now / Schedule → bulk send). `FormDialog` and `ConfirmDialog` both support a real async `onSubmit(FormData)` / `onConfirm()` with busy + inline-error state, closing only on success.

**Tests** — `npm test` (server): RBAC policy + scope, concern state machine, the auth-domain gate, review metrics, deliverable review state, milestone progress rules, config access rules, analytics rollups, email templating, GitHub webhook signing/normalization, Discord Ed25519 verification, calendar scope rules, assistant prompts, escalation evaluation — **66 tests**. (Client: `npm test` — **20 tests**.)

## The module pattern (copy this for every remaining module)

```
modules/<name>/
├── <name>.schema.ts       Zod request schemas + inferred types
├── <name>.repository.ts   the ONLY place Prisma is touched (scope `where` passed in)
├── <name>.service.ts      business logic + audit; depends on the repository (DIP)
├── <name>.state.ts        (optional) pure state machine / domain rules — unit-tested
├── <name>.routes.ts       Router: requireAuth + requirePermission + validateBody + asyncHandler
└── <name>.service.test.ts / <name>.state.test.ts
```
Then: register the router in `app.ts` (`app.use("/api/<name>", requireAuth, <name>Router)`) and add its paths to `lib/openapi.ts`.

## Remaining feature modules
**None — Phase 2's feature surface is complete.** All 23 modules are built, tested, documented in Swagger, and (where applicable) wired to the UI. What remains is **deployment/ops**, not features:
- Rotate any credential ever shared in chat (Neon DB password, Groq key), then update `.env` + Secrets Manager.
- Run real Prisma migrations against RDS (`prisma migrate deploy`); the schema is the source of truth.
- Docker images → ECR → ECS rolling deploy (CI workflow), with `JOBS_ENABLED=true` on exactly one task/instance so the scheduler doesn't double-run.
- Flip the client to `APP_MODE=production` so `lib/api` fetches the real backend instead of fixtures.

## Remaining client wiring
- Flip `APP_MODE=production` so the data layer (`client/lib/api`) fetches the real API instead of fixtures (the `api.*` accessors already do this).
- Wire each page's mutating buttons to `apiMutate(...)` (raise concern, create user, transition concern, etc.) — the helper + CSRF are in place.
- Session-aware shell: redirect to `/login` when `getCurrentUser()` is null; real logout via `logout()`.

## Security posture (in place)
Google-only auth with hosted-domain + allowlist gate · server-side Redis sessions, Secure/HttpOnly/SameSite cookies · CSRF double-submit · helmet headers · CORS limited to the client origin · per-route + auth rate limits · Zod validation at every boundary · three-layer RBAC with query scoping · immutable audit logging · errors never leak internals · secrets from env/Secrets Manager.
