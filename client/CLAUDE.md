<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# client/ — Forge frontend (Next.js)

The UI for **Forge**, a multi-domain university Profile Building Drive platform. This file is self-contained — the rules for this app are below.

## This app's job (and only this)
Dashboards, forms, tables, analytics, role-based views. **No business logic, no database, no secrets, and no direct calls to GitHub / Discord / Google / Groq.** It calls the **server API** (`NEXT_PUBLIC_API_URL` → `/api`) and nothing else. The Prisma schema, all integrations, and all secrets live in the server app, not here.

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (`@theme` tokens in `app/globals.css`) · shadcn-style components (Radix + CVA + a `cn()` class-merge helper). Built as a standalone Docker image and deployed as an ECS container behind an ALB.

## Roles (UI hint only)
`ADMIN · LCC · TEACHER · MENTOR · MENTEE`. The **Student Mentor leads the team** — there is no separate Team Lead role (the Mentor area carries both mentorship and team delivery). A Teacher may span multiple domains. **Any permission logic here is a UI hint only** — real authorization is enforced server-side; never rely on the frontend for access control.

## Next.js 16 conventions (do not regress)
- App Router. Server Components by default; add `"use client"` only for interactivity.
- `params` / `searchParams` / `cookies()` / `headers()` are **async** — `await` them.
- Turbopack is the default bundler — no `--turbopack` flag, no webpack config.
- `middleware.ts` is renamed `proxy.ts` (not added yet).
- Path alias `@/*` → `client/` root. Tailwind tokens live in `app/globals.css` `@theme`, not a JS config. Build with `output: "standalone"` for Docker.

## Design language
Jira / Linear: white surfaces, neutral zinc grays, 1px borders (not shadows), one indigo accent, dense data tables, status color only in badges/flags. No gradients, glassmorphism, or gaming UI. All styling flows from the design tokens + `cn()`; no ad-hoc hex. Provider logos (GitHub/Discord/Calendar) come from `/public` via the brand-icon component.

## Demo mode
`APP_MODE=presentation` shows the file-based mock dataset + a dev "Viewing as" role switcher; `APP_MODE=production` calls the real backend. `NODE_ENV` is reserved by Next.js — don't use it for this; use `APP_MODE`. The client env holds only `NEXT_PUBLIC_API_URL`, `APP_MODE`, `NODE_ENV` — no secrets.

## Engineering principles (apply to all code here)
- Optimize for maintainability, reliability, extensibility — not "it works". Clarity over cleverness; design for change. Every line of code is a liability until it provides value and stays understandable, testable, maintainable.
- **Separation of concerns** — components are presentational; pass data + permissions in. Keep state local; lift only when shared.
- **Composition over inheritance**; small focused components and props (ISP); program to typed contracts (the API types), not ad-hoc shapes.
- **Reliability/UX states** — every data surface implements loading, empty, error, and populated states; expect the API to fail and degrade gracefully.
- **Accessibility** — keyboard nav, visible focus, ARIA labels on icon buttons, sufficient contrast.
- **Testing** — components should be easy to test; if a component is hard to test, simplify its design.
- **Responsible AI dev** — treat generated code as a draft; review and verify before shipping.

## Conventions
- Primitives in `components/ui`, composites in `components/{dashboard,concerns,reviews,integrations,layout}`.
- Routes: `app/(auth)/*` (bare) and `app/(app)/{role}/*` (sidebar shell) + shared `app/(app)/{calendar,connections,notifications,profile,concerns/[id]}`.
- Reusable building blocks: `PageHeader`, `StatCard`, `SectionCard`, `Table`, status badges, `DomainFilter` (URL-synced multi-domain filter, `?domain=AI,ML`), `FormDialog`/`ConfirmDialog`.
- **Data access (DIP):** pages/components import data from `@/lib/api` — **never** from `@/lib/mock/data` directly. `lib/api` is the only module that touches the data source; it serves fixtures in presentation mode and `fetch`es the backend otherwise. The mock→API swap happens there, in one place.
- **Tests:** Vitest + Testing Library (`npm test`). Co-locate `*.test.ts(x)` next to the code. Test behavior (happy/failure/edge); if something is hard to test, simplify the design.
- **Guardrail:** don't `rm -rf .next` while a dev server runs — it corrupts the Turbopack cache.
