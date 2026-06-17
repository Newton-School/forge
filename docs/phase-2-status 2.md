# Phase 2 — Backend status & the module pattern

The Express backend is live with a **production-grade, SOLID, layered foundation**, **Google-OAuth-only auth**, **server-side RBAC + audit**, **Swagger docs**, and three complete reference modules. Remaining feature modules are mechanical — they follow the exact pattern below.

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

**Client wiring (these buttons now POST — presentation-safe via `lib/api.submit()`):** Mentee **Submit Update** (L1) · Mentor **Update status** (L2) · Mentor **Write/New review** (L3) · Teacher **Set decision** (L4) · Teacher faculty-gate **Approve / Revise / Reject** · Mentor **Assign Task** · Mentee **Submit Deliverable** · Mentor deliverable **Approve / Reject** · Mentee **Submit 360° Rating** · LCC **Issue demerit** / **Edit demerit** · Admin **Drive Configuration** (Add/Edit Phase · Gate · Cycle · Rule · Dimension) · Admin **Add/Edit Domain** · Admin **Add/Edit Team**. `FormDialog` and `ConfirmDialog` both support a real async `onSubmit(FormData)` / `onConfirm()` with busy + inline-error state, closing only on success.

**Tests** — `npm test` (server): RBAC policy + scope, concern state machine, the auth-domain gate, review metrics, deliverable review state, milestone progress rules, config access rules — **34 tests**. (Client: `npm test` — **20 tests**.)

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

## Remaining feature modules (same pattern)
Org write (domains/teams/membership) · Email/Notifications · Analytics rollups · Audit-log read · Integrations (GitHub App + webhooks, Discord, Calendar, Groq) · scheduled jobs (auto-flags/escalations, now reading the Configuration module).

## Remaining client wiring
- Flip `APP_MODE=production` so the data layer (`client/lib/api`) fetches the real API instead of fixtures (the `api.*` accessors already do this).
- Wire each page's mutating buttons to `apiMutate(...)` (raise concern, create user, transition concern, etc.) — the helper + CSRF are in place.
- Session-aware shell: redirect to `/login` when `getCurrentUser()` is null; real logout via `logout()`.

## Security posture (in place)
Google-only auth with hosted-domain + allowlist gate · server-side Redis sessions, Secure/HttpOnly/SameSite cookies · CSRF double-submit · helmet headers · CORS limited to the client origin · per-route + auth rate limits · Zod validation at every boundary · three-layer RBAC with query scoping · immutable audit logging · errors never leak internals · secrets from env/Secrets Manager.
