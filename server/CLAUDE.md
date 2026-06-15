# server/ — Forge backend (Node.js + Express + TypeScript)

The backend for **Forge**. This file is self-contained — the rules for this app are below. **All** authentication, authorization (RBAC), business logic, integrations, email, notifications, analytics, audit logging, background jobs, and webhooks live here. The client only renders UI and calls this server's API.

## Hard rule
The client never touches the database or external services. **Every** external API call (GitHub / Discord / Google / Groq) and **every** database query happens in this server. The client talks only to `/api`.

## Authentication — Google OAuth ONLY
- No email/password, no signup. Run the Google **OIDC** authorization-code flow; validate the ID token (Google JWKS signature, `iss`, `aud`, `exp`, `nonce`); grant access only if **both** the Google `hd` hosted-domain is `rishihood.edu.in` **and** the email exists in the users table (admin allowlist). Reject unknown emails.
- **Server-side sessions** (Redis). Browser holds only an opaque session id in a `Secure`, `HttpOnly`, `SameSite` cookie with rolling + idle + absolute timeouts. No JWT/tokens in the browser. Refresh server-side. CSRF protection on state-changing requests. Logout revokes the session.

## Authorization (RBAC) — enforce on every request
- Roles: **Admin, LCC, Teacher, Mentor, Mentee** (the Student Mentor leads the team — no separate Team Lead). Model is `role × scope` (scope ∈ `GLOBAL | DOMAIN | TEAM | SELF`); Teachers can span multiple domains.
- Three enforcement layers, always: (1) route gate, (2) policy `can(user, action, resource)`, (3) **scope-filtered DB query**. Domain isolation, team isolation, and ownership checks are mandatory. Never trust anything from the client.

## Architecture & standards
- Express + TypeScript, ES modules. **Layered, dependencies flowing inward:** `routes → controllers → services → repositories (Prisma)`. Business rules live **only** in services; repositories return scope-filtered data. Program to interfaces (DIP); keep modules cohesive and loosely coupled (SRP, ISP).
- Middleware order: session/auth → RBAC → **Zod** validation → rate-limit → error handler → request logging (pino).
- Validate **every** input at the boundary (Zod). **Audit** every privileged/mutating action (immutable log: actor, action, entity, before/after, ip, timestamp). **Verify webhook signatures** (GitHub HMAC, Discord Ed25519).
- Integrations are isolated behind service modules (Adapter pattern) — swap implementations without touching callers.
- **Data:** Prisma + RDS PostgreSQL. Schema lives in `server/prisma`. Model entities clearly with explicit relations and DB-level constraints; design migrations for change (no destructive migrations; version them); index hot fields, measure before optimizing.

## Secrets & config
- Secrets come from env locally (`server/.env`, git-ignored) and **AWS Secrets Manager** (`/forge/<env>/*`) in production — never committed, never in the image. Validate required env at boot (fail fast). Rotate any key ever shared.

## Reliability & observability
- Expect failures: time out external calls, retry idempotently, degrade gracefully (a down integration must not break core flows). Emit structured logs, metrics, and traces; surface failures. Health endpoint `GET /api/health` backs the ALB/ECS checks.

## Build & run
- `npm run dev` (tsx watch) locally; `npm run build` → `dist/`; runs as a **non-root** hardened Docker container on ECS Fargate. Use `dumb-init` as PID 1.

## Engineering principles (apply to all code here)
- Maintainability, reliability, extensibility over "it works". Clarity over cleverness; design for change. Every line of code is a liability until it earns its keep and stays understandable, testable, maintainable.
- **Composition over inheritance**; encapsulate (hide internals, protect invariants, no God services); abstraction before implementation; polymorphism/Strategy over sprawling conditionals.
- **SOLID** throughout (SRP, OCP, LSP, ISP, DIP). Use design patterns only to solve real problems, weighing trade-offs.
- **Testing:** define behavior first; cover happy + failure + edge paths; deterministic unit tests with stubs/mocks/fakes; if it's hard to test, fix the design.
- **Monolith-first:** this is a modular monolith — split into services only when independent scaling or clear domain boundaries truly require it.
- **Responsible AI dev:** treat generated code as a draft — verify with tests and review before production. Requirements → Prompt → Code → Tests → Review → Production. AI accelerates; it doesn't replace engineering judgment.
