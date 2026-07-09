# CLAUDE.md — Forge (single source of truth)

Forge is a production, multi-domain (AI / ML / SDSE) university **Profile Building Drive** platform — students, mentors, teachers, the LCC, and admins on one system. This file is the **complete, self-contained ruleset** for the repo. Follow it. Do not assume anything from older notes.

> **This is architecture v2.** Forge is **NOT** Vercel, **NOT** serverless-only, does **NOT** put business logic in Next API routes, and does **NOT** use email/password auth. Any such assumption is wrong and removed.

---

## 1. Repository — single repo, two apps (NOT a Turborepo)
```
portal/
├── client/   Next.js — UI only
├── server/   Node.js + Express + TypeScript — ALL business logic
├── docs/     written docs (not authoritative for rules — this file is)
├── infra/    ecs/ task defs · aws/ IAM · terraform/ (placeholder)
├── docker/   client.Dockerfile · server.Dockerfile · nginx/
├── scripts/
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── README.md
└── CLAUDE.md
```
`client/` and `server/` are independent apps in one repo. **Do not** introduce `apps/`/`packages/` or Turborepo.

## 2. Deployment topology (AWS ECS — the only target)
```
Internet → Cloudflare (WAF / DDoS / DNS proxy) → Route 53 → Application Load Balancer (TLS via ACM)
        → AWS ECS Fargate: client container (Next SSR :3000) + server container (Express :8000)
        → Amazon RDS for PostgreSQL
   + ECR (images) · Secrets Manager (secrets) · CloudWatch (logs/metrics) · ElastiCache Redis (sessions/cache)
```
The ALB routes `/api/*` → server, everything else → client. Not Vercel. Not Lambda. Not EC2-only.

## 3. Hard boundaries
- **Client = UI only.** No business logic, no database access, and no direct calls to GitHub / Discord / Google / Groq. It calls the **server API** (`NEXT_PUBLIC_API_URL` → `/api`) and nothing else.
- **Server owns everything else:** authentication, authorization (RBAC), business logic, integrations, email, notifications, analytics, audit logging, background jobs, webhooks. All external API and database access happens here.

## 4. Authentication — Google OAuth ONLY
- No email/password, no signup, no custom credentials.
- The server runs the Google **OIDC** authorization-code flow, validates the ID token (signature via Google JWKS, `iss`, `aud`, `exp`, `nonce`), and grants access only if **both**: (a) the Google `hd` hosted-domain is `rishihood.edu.in`, and (b) the email already exists in the users table (admin-provisioned allowlist). Unknown emails are **rejected**.
- Sessions are **server-side** (Redis-backed). The browser holds only an **opaque session id** in a `Secure`, `HttpOnly`, `SameSite` cookie, with rolling + idle + absolute timeouts. Refresh is handled server-side. **No JWT or tokens in the browser.** CSRF protection on all state-changing requests. Logout revokes the session.

## 5. RBAC — server-side only, never trust the frontend
- Roles: **Admin, LCC, Teacher, Mentor, Mentee** (five). The **Student Mentor leads the team** — there is no separate Team Lead role (the Mentor carries both mentorship and team delivery). *(If the team later confirms re-adding Team Lead, it's a small config change — until then, five roles.)*
- Model is `role × scope`, scope ∈ `GLOBAL | DOMAIN | TEAM | SELF`. A **Teacher may span multiple domains**.
- Enforce at **three layers** on every request: (1) route gate, (2) policy `can(user, action, resource)`, (3) **scope-filtered database query**. Domain isolation, team isolation, and resource-ownership checks are mandatory. Any permission logic in the frontend is a **UI hint only** and is never trusted.
- **User onboarding is invite-only and restricted to Admin + LCC** (`user:create`, `user:update`, `invitation:send`, `invitation:read`). Creating a user provisions the allowlist entry and auto-sends a Google-OAuth onboarding invitation (tracked `Invitation` row: Pending → Sent → Opened → Completed/Expired). No self-signup. See `docs/auth-onboarding.md`.

## 6. AWS account isolation (the account also runs OTHER services)
Forge must have **zero blast radius** into the other services sharing the AWS account:
- **Dedicated** VPC, ECS cluster, RDS instance, ECR repos, and security groups — never shared or reused.
- **IAM scoped to Forge only** — resource ARNs + `aws:ResourceTag/app = forge` conditions; **no wildcard `Resource: "*"`** (the sole exception is `ecr:GetAuthorizationToken`, which AWS forbids scoping).
- Secrets namespaced `/forge/<env>/*`; logs `/ecs/forge/*`; a **dedicated KMS CMK** whose key policy admits only Forge roles; every resource tagged `app=forge,env=<env>`.
- No VPC peering/transit to other apps. RDS is private and **not publicly accessible**; tasks run in private subnets. Security groups are least-privilege (ALB ← Cloudflare:443 only; server ← ALB; RDS ← server:5432).

## 7. Backend standards (server/)
- Express + TypeScript, ES modules. Layered: `routes → controllers → services → repositories (Prisma)`. Business rules live **only** in services; repositories return scope-filtered data.
- Middleware stack: session/auth → RBAC → **Zod** validation → rate-limit → error handler → request logging (pino).
- Validate **every** input at the boundary with Zod. **Audit** every privileged/mutating action (immutable audit log: actor, action, entity, before/after, ip, timestamp). **Verify webhook signatures** (GitHub HMAC, Discord Ed25519).
- Data: Prisma + **RDS PostgreSQL**. Migrations via Prisma. `sslmode=require`. Pooled connection at runtime; direct connection for migrations. The Prisma schema lives in `server/`.
- Integrations (GitHub, Discord, Google Calendar, Groq) are **server-only**, behind service modules. Groq calls are capped and rate-limited.

## 8. Frontend standards (client/)
- Next.js (App Router; the repo currently runs **Next 16.x** — Turbopack is the default bundler, no `--turbopack` flag, no webpack config). Server Components by default; add `"use client"` only for interactivity. `params`, `searchParams`, `cookies()`, `headers()` are **async** — await them. `middleware.ts` is renamed `proxy.ts` (not added yet). Build with `output: "standalone"` for the Docker image. Path alias `@/*` → `client/` root.
- Tailwind v4 with `@theme` tokens in `app/globals.css` (no JS config). shadcn-style components (Radix + CVA + a `cn()` class-merge helper).
- **Design language:** Jira / Linear — white surfaces, neutral zinc grays, 1px borders (not shadows), one indigo accent, dense data tables, status color only in badges/flags. No gradients, glassmorphism, or gaming UI. All styling flows from the design tokens; no ad-hoc hex.
- **Demo mode:** `APP_MODE=presentation` shows the file-based mock dataset plus a dev "Viewing as" role switcher; `APP_MODE=production` calls the real backend. `NODE_ENV` is reserved by Next.js — do not use it for this; use `APP_MODE`.
- The client holds **no secrets** — only `NEXT_PUBLIC_API_URL`, `APP_MODE`, `NODE_ENV`.

## 9. Docker & deploy workflow
- Multi-stage, **non-root**, hardened Dockerfiles for both apps. Local dev runs the full stack via `docker compose up` (client + server + postgres + redis).
- CI builds each changed app → pushes to **ECR** (AWS auth via GitHub OIDC, **no static keys**) → renders the task definition → **ECS rolling deploy** with the deployment circuit breaker (auto-rollback). Secrets are injected from Secrets Manager — never baked into images or committed.

## 10. Secrets
- No secrets in git. `client/.env` and `server/.env` are git-ignored; production uses **AWS Secrets Manager** (`/forge/<env>/*`). Only `NEXT_PUBLIC_*` vars ever reach the browser.
- **Rotate any key that has ever been shared** (e.g. in chat), then update the env and Secrets Manager.

## 11. Guardrails
- Do **not** `rm -rf .next` (client) while a dev server is running — it corrupts the Turbopack cache.
- Keep this file authoritative and self-contained. When an architecture rule changes, update **this file** in the same change. No Vercel / serverless-only / email-password / Team-Lead-role / "PBDMP" language anywhere.
- Before implementing any feature, verify it obeys every boundary above (client = UI only; server owns logic; Google-only auth; server-side RBAC; account isolation).

---

## 12. Engineering principles & rules (apply to ALL Forge code)

**Mindset.** Engineer, don't just program: optimize for maintainability, reliability, and extensibility — never just "it works". Clarity over cleverness. Design for change, not only for today. Every line of code is a liability until it provides value and stays understandable, testable, and maintainable.

**OOP.**
- **Encapsulation** — hide internals, protect invariants, expose only what consumers need. No public mutable state; no God objects/modules.
- **Abstraction** — define contracts/interfaces before implementations; program to interfaces, not concretions; hide complexity behind meaningful APIs.
- **Composition over inheritance** — inherit only for a true "is-a"; avoid deep hierarchies (frequent overrides / fragile parent-child = smell).
- **Polymorphism** over large conditional logic; let behavior vary without editing callers.

**SOLID.**
- **SRP** — one reason to change per module. **OCP** — open for extension, closed for modification. **LSP** — subtypes must be substitutable (don't strengthen preconditions or weaken postconditions). **ISP** — small, focused interfaces; no kitchen-sink interfaces. **DIP** — depend on abstractions; inject dependencies.

**Design patterns.** Use a pattern only to solve a real recurring problem and only after weighing trade-offs — never because it exists. Factory for complex creation; Singleton sparingly (prefer DI, keep testable); Adapter for third-party/legacy APIs; Strategy for interchangeable algorithms; Observer for event-driven flows (keep publishers/subscribers decoupled).

**System design.**
- **Scalability** — design for growth, remove bottlenecks early, prefer horizontal scaling. Always ask: what happens at 100× users, and what becomes the bottleneck?
- **Reliability** — expect failures; graceful degradation; retries/recovery.
- **Maintainability** — independent modules, low coupling, high cohesion; a new dev should understand it quickly.
- **Observability** — meaningful logs, metrics, traces; make failures visible.

**Database.** Model entities clearly, define relationships explicitly, enforce constraints at the DB. Design schemas for change; avoid destructive migrations; version every migration. Index frequently-queried fields; measure before optimizing; know the access patterns.

**Testing.** Define expected behavior before implementing; cover happy paths, failure paths, and edge cases. Unit tests test one behavior, are deterministic, and avoid external dependencies (use stubs/mocks/fakes). **If code is hard to test, the design is wrong — fix the design.**

**Code organization.** Separation of concerns — one responsibility per module. **Layered architecture with dependencies flowing inward** (presentation → business → data-access → infrastructure; inner layers never depend on outer). High cohesion, low coupling, clear boundaries. **Monolith-first** — the server is a modular monolith; distribute into services only when independent scaling or clear domain boundaries truly demand it.

**Process & collaboration.** Understand requirements before building; validate assumptions early; deliver incrementally; embrace feedback. Automate repetitive work; treat infrastructure as code; build deployment confidence. Commit frequently with meaningful messages; keep PRs small. Review for maintainability (not just correctness), give constructive feedback, share knowledge. Document **decisions**, not obvious code; keep docs next to the code; update them when behavior changes.

**Responsible AI-assisted development.** Treat AI-generated code as a **draft**: verify it with tests and review it before it ships — never trust generated code blindly. Flow: **Requirements → Prompt → Generated code → Tests → Review → Production.** AI accelerates development; it does not replace engineering judgment.
