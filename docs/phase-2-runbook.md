# Phase 2 — Run & Stabilization Runbook

What was built this session (Phase 2 backend + the team-first GitHub vertical), the schema
deltas to apply, and how to run it live. The project uses **`prisma db push`** (no migrations
folder), so schema changes are applied by push, not migrate.

## Verified green
- Server: `npm test` → **107 tests / 22 files pass**; `npm run build` clean.
- Client: `npx tsc --noEmit` clean; `npm run build` clean; presentation smoke (team-first
  GitHub routes for ML / DVA / SDSE / AI) all 200, no errors.

## Schema deltas to apply (`prisma db push`)
All additive (no destructive changes):
- **`Domain.githubRepoModel`** — enum `DomainRepoModel { ORG | SHARED | PER_STUDENT }` (AI=ORG, DVA/SDSE=SHARED, ML=PER_STUDENT).
- **`Team` → many `Repository`** (was one-per-team): `Repository.teamId` is no longer unique (`@@index([teamId])`).
- **`Repository.ownerUser` / `ownerUserId` / `ownerRole`** — per-student repo ownership (ML).
- **`Deliverable.name`** (UI title), **`Concern.seq`** (autoincrement → `CON-<seq>` ref), **`EmailTemplate.updatedAt`** — from the earlier core-drive slices.
- **Testing Portal** — enums `TestSeverity { LOW | MEDIUM | HIGH | CRITICAL }`, `TestDomainStatus { NOT_STARTED | IN_PROGRESS | COMPLETED }`; models `TestingProgress` (`@@unique([testerEmail, domainKey])`), `TestIssue` (`@@index([testerEmail])`, `@@index([domainKey])`), and the DB-backed test script `TestPlan` (`domainKey @unique`) + `TestPlanStep` (`@@unique([planId, stepKey])`, `@@index([planId, seq])`, cascade on plan). **Re-run `npm run db:seed` after the push** — the seed upserts the 4 test plans + steps.

## Run the GitHub vertical live
```bash
cd portal/server
# .env needs DATABASE_URL / DIRECT_URL, REDIS_URL, GitHub token + org config, Google OAuth, SESSION_SECRET
npx prisma db push          # apply the schema deltas above
npm run db:seed             # domain repo models + non-AI teams/members/repos (ML per-student, DVA/SDSE shared)
npm run dev                 # Express API on :4000
```
```bash
cd portal/client            # APP_MODE=production, NEXT_PUBLIC_API_URL=/api, API_PROXY_TARGET=<server origin>
npm run dev
```

## Team-first GitHub endpoints (server)
- `GET /api/integrations/github/domain-teams?domain=ML` — teams + roster + repo summaries + repo model (scope-filtered).
- `GET /api/integrations/github/teams/:teamId/graph` — one team's roster + repo summaries.
- `GET /api/integrations/github/teams/:teamId/repos` — the team's repos (1 shared, or N per-student).
- `GET /api/integrations/github/teams/:teamId/repos/:repo/dashboard` — one repo's full **live** dashboard.

## Testing Portal endpoints (server) — tester-allowlist gated
All under `app.use("/api/testing", requireAuth, …)`; access is restricted to the fixed tester
email allowlist (`testing.allowlist.ts`), **separate from RBAC roles**. The Testing Admin
(`shaik.tajuddin2024@nst.rishihood.edu.in`) sees every reported issue.
- `GET  /api/testing/whoami` — `{ email, isTester, isAdmin }`.
- `GET  /api/testing/progress` — the caller's per-domain progress (Resume).
- `PUT  /api/testing/progress/:domain` — upsert one domain's progress (status · done · skipped · current).
- `POST /api/testing/provision/:domain` — **Testing Admin only.** Provisions the domain's real environment: upserts the fixed 5-tester roster as real users with RBAC roles (Abhinav→TEACHER/domain · Aniket+Anwesha→MENTOR/team · Khushi+Nikith→MENTEE), upserts the domain team (`t-test-<key>`) + memberships (Aniket = primary `team.mentorId`), and sends a Google-OAuth onboarding invite to each **newly created** account. The mock's "Team Lead" maps to MENTOR (no Team Lead role exists). **One domain at a time:** provisioning first tears down any previously provisioned domain (so the roster is re-created fresh and re-invited for the new domain). Idempotent.
- `POST /api/testing/teardown` — **Testing Admin only.** End Testing: deletes the provisioned tester accounts + their test teams and **all data hanging off them** (roles, invites, memberships, repos, projects/tasks/deliverables/milestones, concerns, demerits, updates, activity), in one FK-safe transaction. **Kept:** the seeded Admin (Shaik) + LCC, the domains/drive, and the `TestingProgress`/`TestIssue` report.
- `GET  /api/testing/report` — persistent testing report (survives teardown): per-domain status rollup + issue counts + the raw progress/issue rows. Admin → everyone's; other testers → their own.
- `GET  /api/testing/whoami` — also returns the real `name` + primary `role` from the session (used by the portal's "acting as" card in production — no mock identity).
- `GET  /api/testing/environment/:domain` — the REAL provisioned environment (test team + members by role + repos + domain teacher); `provisioned:false` when the domain hasn't been started.
- `GET  /api/testing/plans` — the DB-backed guided test script (per-domain name/model + ordered steps). Seeded from `testing.plans.data.ts`; editable directly in `TestPlan`/`TestPlanStep` without a redeploy. `saveProgress` derives domain status server-side from `done`/`skipped` vs the plan's real step count (the client value is only a fallback when a plan isn't seeded). The client `usePlans()` hook uses these in production and the mock fixtures in presentation.

### Presentation vs production — no mock / no localStorage in production
The Testing Portal has two strictly separated backends, switched by `APP_MODE`:
- **Presentation** — mock fixtures + **localStorage**. Tester switcher, mock domain environment, local progress. No backend needed (demo).
- **Production** — **everything from the server (Postgres); no mock data, no localStorage.** Identity from `/whoami`, progress from `/progress` (write-through on every step), issues from `/issues`, environment from `/environment/:domain`, report from `/report`. The tester is the logged-in user (no switching). The store (`components/testing/store.ts`) picks the backend off `TESTING_PRESENTATION`.
- `POST /api/testing/issues` — record an issue **and** email the Testing Admin (best-effort; capture never blocks on email).
- `GET  /api/testing/issues` — Testing Admin → all issues; other testers → their own.

Client seam: `client/lib/api/testing.ts` best-effort syncs the localStorage store to these
endpoints in production; in presentation mode the calls are no-ops (localStorage is authoritative).
**Start Testing** (the portal's per-domain button) calls `provisionDomain` on a fresh start:
presentation → pure simulation (no DB/email); production → real provisioning + invites (a
non-admin tester gets the 403 surfaced inline under the button). **End Testing** (the domain
runner header, confirm dialog) calls `teardown` — presentation no-op, production clears the
provisioned env (Testing Admin only). Switching domains auto-clears the previous one.

## Data-availability design (important)
- **Grid / domain dashboard / team overview** → DB-available summaries (repos · members · branches · releases). **No live GitHub calls.**
- **Repository detail** (+ shared-team overview) → **full live** GitHub data (commits · PRs · activity · milestones) via the per-repo dashboard endpoint.
- Per-student commit/PR metrics intentionally load at the repo detail, not the grid, to avoid N live calls per domain.

## Expected behaviour by domain
- **AI** → org-mode dashboards (unchanged, live from the connected org).
- **ML** → team → per-student **independent** repository grid → drill into a student's live repo.
- **DVA / SDSE** → team → the **shared** repo with full team context (live at detail).

## Known follow-ups (not blocking)
- Seeded ML/DVA/SDSE repo `fullName`s are placeholders — point them at real org repos (or connect per team) for live sync to populate branches/releases/collaborators.
- A sync job to populate commit/PR aggregates would let the grid show activity counts without live calls (currently deferred to detail).
- `admin/configuration` (settings form) domain options still read the fixture (low-value, documented).
