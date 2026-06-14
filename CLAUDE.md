<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PBDMP — Profile Building Drive Management Platform

A centralized, multi-domain (AI / ML / SDSE) platform to run a university mentorship & project drive: students, mentors, teachers, LCC, and admins on one dashboard. This `portal/` app is the product.

## Read first
- Product spec: `docs/02_Platform_PRD.md` · Source analysis: `docs/01_RawDocs_Analysis_Report.md`
- Engineering: `docs/architecture.md` · `docs/security-rbac.md` · `docs/ui-ux.md`
- Flows: `docs/user-flows.html` (who creates/assigns/reviews each item, per role)
- Ops: `docs/setup-guide.md` · `docs/integration-setup.md` · `.env.example`

**Before implementing any feature, verify it aligns with the PRD.**

## Stack
Next.js 16 (App Router, Turbopack default) · React 19 · TypeScript · Tailwind CSS v4 (CSS `@theme` tokens, no JS config) · shadcn-style components (Radix + CVA + `cn()`) · Prisma 7 + Neon Postgres · Auth.js v5 (planned) · Nodemailer · Groq. Deploys to **Vercel Free Tier**.

## The five roles
`ADMIN · LCC · TEACHER · MENTOR · MENTEE`. The **Student Mentor leads the team** — there is no separate Team Lead role; the Mentor area carries both mentorship (mentees, L2/L3 reviews) and team delivery (board, blockers, deliverables). Defined in `lib/types.ts` (`RoleKey`), `lib/rbac/permissions.ts`, `lib/labels.ts`, `lib/nav/nav.config.ts`.

## Next.js 16 conventions (do not regress)
- App Router only. Server Components by default; add `"use client"` only for interactivity.
- `params` and `searchParams` are **Promises** — `const { id } = await params`, `const sp = await searchParams`. Same for `cookies()`/`headers()`.
- Turbopack is the default bundler — **no `--turbopack` flag**. Don't add a webpack config.
- `middleware.ts` is renamed to **`proxy.ts`** (not added in Phase 1).
- Path alias `@/*` → repo root (no `src/`). Tailwind v4: edit tokens in `app/globals.css` `@theme`, not a config file.
- **Never `rm -rf .next` while a dev server is running** — it corrupts the Turbopack cache (ENOENT / "corrupted database"). Stop the server first, or just restart it.

## Architecture rules
- **Serverless monolith.** One Next app, no workers, no Redis, cron-light. Defer work to on-read or webhooks.
- **Modules are logical** (`lib/services/*`), not network services. One Prisma client (`lib/db`).
- **RBAC = role × scope.** Every server read is **scope-filtered at the query layer** (`lib/rbac/scope.ts`); every action checks `can()` (`lib/rbac/policy.ts`). UI uses the same `can()` for show/hide — but **the server is the boundary**.
- **Config is data.** Phases, gates, review cycles, escalation thresholds, rubrics are DB rows, never hardcoded constants. They carry an optional `domainId` (null = all domains) so config can target one domain at a time.
- Cadence is stored **structured** (`intervalValue` + `intervalUnit` + optional `anchorDay`), never as the text "every 2 days". Phases/gates store exact `DateTime`s.
- Teachers↔domains is **many-to-many** (`Domain.teachers` ↔ `User.taughtDomains`) — a teacher can span domains.
- Validate inputs with **Zod** at every boundary; audit every privileged/mutating action (`AuditLog`).

## Design language
Jira / Linear / Vercel: white surfaces, neutral zinc grays, 1px borders (not shadows), one indigo accent, dense data tables, status color only in badges/flags. No gradients, glassmorphism, or gaming UI. All styling flows from `app/globals.css` tokens + `cn()`. Provider logos (GitHub/Discord/Calendar) come from `/public` via `components/integrations/brand-icon.tsx`.

## Presentation mode (demo)
The app ships a file-based mock dataset (`lib/mock/data.ts`) — no database needed to run it. Gate it with `APP_MODE` (see `lib/config.ts`):
- `APP_MODE=presentation` → demo on: shows the mock data + the dev "Viewing as" role switcher + a "Presentation" badge in the top bar.
- `APP_MODE=production` → demo off (real backend, Phase 3).
- `NODE_ENV` is reserved by Next.js — **don't** use it for this; use `APP_MODE`.

## Current phase (Phase 1)
UI + design system + layouts + navigation + mock data only.
- **Do NOT** add `proxy.ts`, live auth enforcement, or heavy backend yet.
- Dashboards read from `lib/mock/data.ts`. Session is a cookie-based dev stub (`lib/session.ts`) keyed off the role switcher.
- Modals (`components/ui/form-dialog.tsx` → `FormDialog`/`ConfirmDialog`/`Field`) are presentational — they open, fill, and close; no persistence yet.
- `prisma/schema.prisma` and `lib/rbac/*` are design artifacts; Phase 3 activates them without refactor.

## Conventions
- Components: primitives in `components/ui`, composites in `components/{dashboard,concerns,reviews,integrations,layout}`.
- Routes: `app/(auth)/*` (bare shell) and `app/(app)/{role}/*` (sidebar shell), plus shared `app/(app)/{calendar,connections,notifications,profile,concerns/[id]}`. One folder per role.
- Reusable building blocks: `PageHeader`, `StatCard`/`StatGrid`, `SectionCard`, `DataTable`-style `Table`, status badges (`components/dashboard/status-badge.tsx`), `DomainFilter` (URL-synced multi-domain filter, `?domain=AI,ML`), `FormDialog`/`ConfirmDialog`.
- Keep components presentational; pass data + permissions in. No ad-hoc hex — use tokens. Filter by domain server-side with `lib/domains.ts` (`parseDomains`, `inDomains`).
