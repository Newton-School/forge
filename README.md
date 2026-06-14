# PBDMP — Profile Building Drive Management Platform

A centralized, multi-domain platform to run a university **Summer Profile Building Drive** — students, mentors, teachers, the LCC, and admins on one dashboard. It replaces scattered spreadsheets, Discord threads, and email chains with a single source of truth for progress, reviews, blockers, concerns, and evaluation.

> **Status:** Phase 1 — UI, design system, navigation, and a file-based mock dataset. No live auth, route protection, or database yet (all designed so Phase 3 activates them without a rewrite). See [Documentation](#documentation).

---

## Highlights

- **Five roles, one app:** `Admin · LCC · Teacher · Mentor · Mentee`. The **Student Mentor leads the team** (no separate Team Lead role) — the Mentor area carries both mentorship and team delivery.
- **The review loop (L1→L4):** mentee updates every 2 days → mentor status & weekly review → teacher decision — modeled as the core workflow, with auto-flags for inactivity and stale blockers.
- **Concern management:** any role can raise a concern → ticket + email routed to LCC (CC organizing team) → tracked lifecycle.
- **Configuration is data:** phases, gates, review cycles, escalation thresholds, and rubrics are admin-editable — applied to **all domains or one domain at a time**. Phases/gates use a real date-time picker; cadences are stored as a number + unit (not the text "every 2 days").
- **Multi-domain everywhere:** a URL-synced domain filter (`?domain=AI,ML`) across Admin/LCC oversight pages, and **teachers can span multiple domains**.
- **Integrations (designed):** GitHub, Discord, Google Calendar — verified via OAuth (usernames come from the provider, not typed). A shared Calendar shows drive-wide LCC events.
- **Jira / Linear aesthetic:** clean white surfaces, neutral grays, hairline borders, one indigo accent, dense data tables.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React 19) |
| Language | TypeScript |
| Styling | **Tailwind CSS v4** (CSS `@theme` tokens, no JS config) |
| Components | shadcn-style (Radix UI + CVA + `cn()`), `lucide-react` icons |
| Data (design) | **Prisma 7** + Neon Postgres |
| Auth (planned) | Auth.js v5 (Credentials + JWT, Argon2id) |
| Email / AI (planned) | Nodemailer · Groq |
| Hosting | Vercel (Free Tier) |

---

## Getting started

**Prerequisites:** Node.js **≥ 20.9** (Next 16 minimum), npm.

```bash
cd portal
npm install
cp .env.example .env      # then fill values — but demo mode runs without a DB
npm run dev               # http://localhost:3000
```

The app runs **without a database** in demo mode (it reads `lib/mock/data.ts`). Use the **"Viewing as"** switcher in the top bar to preview all five role dashboards.

### Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the build |
| `npm run lint` | ESLint |

---

## Presentation (demo) mode

The mock dataset is the persistent demo data — kept in a file, no DB. Toggle it with **`APP_MODE`**:

```bash
APP_MODE=presentation   # demo ON  — mock data + role switcher + "Presentation" badge
APP_MODE=production      # demo OFF — real backend (Phase 3)
```

> `NODE_ENV` is reserved by Next.js (it forces `development`/`production`), so **use `APP_MODE`** as the switch.

---

## Project structure

```
portal/
├── app/
│   ├── (auth)/            login · forgot-password · reset-password · first-login
│   ├── (app)/             authenticated shell (sidebar + top bar)
│   │   ├── admin/         users · domains · teams · roles · configuration · integrations · email-templates · audit-logs
│   │   ├── lcc/           dashboard · drive-health · domains · teams · concerns · email · onboarding · demerits · analytics
│   │   ├── teacher/       overview · teams · students · reviews & gates · mentor performance · analytics
│   │   ├── mentor/        dashboard · mentees · reviews · team · board · blockers · tasks · deliverables
│   │   ├── mentee/        dashboard · tasks · deliverables · milestones · reviews · feedback · team
│   │   └── (shared)       calendar · connections · notifications · profile · concerns/[id]
│   ├── globals.css        Tailwind v4 design tokens (@theme)
│   └── layout.tsx
├── components/
│   ├── ui/                primitives (Button, Card, Table, Dialog, FormDialog, Select, …)
│   ├── dashboard/         StatCard, SectionCard, PageHeader, status badges, DomainFilter, charts
│   ├── layout/            Sidebar, TopNav, RoleSwitcher
│   └── concerns/ reviews/ integrations/   composite features
├── lib/
│   ├── config.ts          presentation-mode flag
│   ├── types.ts labels.ts utils.ts        shared types & helpers
│   ├── rbac/              permissions · policy (can()) · scope (scopeWhere())
│   ├── nav/               role → sidebar config
│   ├── domains.ts         domain-filter helpers (parseDomains, inDomains)
│   ├── session.ts         dev session (cookie-based role switching)
│   └── mock/data.ts       the presentation dataset
├── prisma/schema.prisma   data model (design artifact)
└── docs/                  PRD, architecture, security/RBAC, UI/UX, setup, integration, user flows
```

---

## Documentation

| File | What it covers |
|---|---|
| [`docs/02_Platform_PRD.md`](docs/02_Platform_PRD.md) | Full product requirements |
| [`docs/01_RawDocs_Analysis_Report.md`](docs/01_RawDocs_Analysis_Report.md) | Source-material analysis the PRD is built from |
| [`docs/architecture.md`](docs/architecture.md) | System & data architecture, auth approach |
| [`docs/security-rbac.md`](docs/security-rbac.md) | RBAC model, permission matrix, data isolation |
| [`docs/ui-ux.md`](docs/ui-ux.md) | Design system & component library |
| [`docs/user-flows.html`](docs/user-flows.html) | Who creates / assigns / reviews each item, per role |
| [`docs/setup-guide.md`](docs/setup-guide.md) · [`docs/integration-setup.md`](docs/integration-setup.md) | Local/Vercel setup · GitHub/Discord/Calendar OAuth |

---

## Roadmap (capabilities, not dates)

- **Phase 1 (now):** UI, design system, navigation, mock data, all modals & filters (presentational).
- **Phase 2:** Auth.js + `proxy.ts` route protection, Prisma migrations on Neon, server actions persisting the modals.
- **Phase 3:** Live GitHub/Discord/Calendar sync, email (Nodemailer), Groq assist, analytics rollups.

---

## Notes for contributors

- **Don't `rm -rf .next` while a dev server is running** — it corrupts Turbopack's cache. Stop the server first, or just restart it.
- Server Components by default; `params`/`searchParams`/`cookies()` are **async** (Next 16).
- Styling flows from `app/globals.css` tokens + `cn()` — no ad-hoc hex.
- See [`CLAUDE.md`](CLAUDE.md) for the full engineering conventions.

---

*Internal project — all rights reserved.*
