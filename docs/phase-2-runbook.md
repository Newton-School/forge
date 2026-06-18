# Phase 2 — Run & Stabilization Runbook

What was built this session (Phase 2 backend + the team-first GitHub vertical), the schema
deltas to apply, and how to run it live. The project uses **`prisma db push`** (no migrations
folder), so schema changes are applied by push, not migrate.

## Verified green
- Server: `npm test` → **104 tests / 21 files pass**; `npm run build` clean.
- Client: `npx tsc --noEmit` clean; `npm run build` clean; presentation smoke (team-first
  GitHub routes for ML / DVA / SDSE / AI) all 200, no errors.

## Schema deltas to apply (`prisma db push`)
All additive (no destructive changes):
- **`Domain.githubRepoModel`** — enum `DomainRepoModel { ORG | SHARED | PER_STUDENT }` (AI=ORG, DVA/SDSE=SHARED, ML=PER_STUDENT).
- **`Team` → many `Repository`** (was one-per-team): `Repository.teamId` is no longer unique (`@@index([teamId])`).
- **`Repository.ownerUser` / `ownerUserId` / `ownerRole`** — per-student repo ownership (ML).
- **`Deliverable.name`** (UI title), **`Concern.seq`** (autoincrement → `CON-<seq>` ref), **`EmailTemplate.updatedAt`** — from the earlier core-drive slices.

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
