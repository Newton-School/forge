# Architecture v2 — Forge (Profile Building Drive Management Platform)

> **Status:** Master architecture document for the v2 refactor.
> **Supersedes:** [architecture.md](./architecture.md) (v1, Vercel/serverless).
> **Companion docs:** [infra-ecs.md](./infra-ecs.md) · [security.md](./security.md) · [integration-setup.md](./integration-setup.md) · [repo-guide.html](./repo-guide.html)
> **Product spec:** [02_Platform_PRD.md](./02_Platform_PRD.md) · **Source analysis:** [01_RawDocs_Analysis_Report.md](./01_RawDocs_Analysis_Report.md)

This document is the single source of truth for the v2 system shape: a **client/server split** deployed on **AWS ECS (Fargate)**, replacing the v1 serverless monolith on Vercel. It defines *how* the system is structured. Operational/provisioning detail lives in [infra-ecs.md](./infra-ecs.md); authn/authz detail lives in [security.md](./security.md). Where those docs own the detail, this document summarizes and links.

The application identifier used across all AWS resources, namespaces, and tags is **`forge`**.

---

## Table of contents

1. [Executive summary — the pivot](#1-executive-summary--the-pivot)
2. [Guiding principles](#2-guiding-principles)
3. [Repository architecture](#3-repository-architecture)
4. [Client architecture](#4-client-architecture)
5. [Server architecture](#5-server-architecture)
6. [Request & data flow](#6-request--data-flow)
7. [Security architecture (summary)](#7-security-architecture-summary)
8. [RBAC architecture](#8-rbac-architecture)
9. [Infrastructure architecture](#9-infrastructure-architecture)
10. [What changed from v1](#10-what-changed-from-v1)
11. [Migration plan](#11-migration-plan)
12. [Open questions / decisions to confirm](#12-open-questions--decisions-to-confirm)

---

## 1. Executive summary — the pivot

### 1.1 From this (v1)

Forge v1 was a **single Next.js application** (App Router) deployed to **Vercel** on the free tier. UI, API route handlers, server actions, business logic, RBAC policy, integration calls (GitHub/Discord/Google/Groq), and Prisma all ran inside one deployable unit executed as **short-lived serverless/edge functions**. The database was **Neon serverless Postgres**. Authentication was planned as **Auth.js (NextAuth) Credentials** — email + password with Argon2id hashing.

This shape was correct for a Phase-1 UI build under free-tier constraints, but it does not meet the production requirements of the drive: a long-lived, multi-tenant, integration-heavy platform that must run inside a **shared, governed AWS account** with strict isolation, predictable scaling, real background jobs, and institutional SSO.

### 1.2 To this (v2)

```
Internet ─▶ Cloudflare (DNS proxy · WAF · DDoS) ─▶ Route 53 ─▶ ALB (TLS/ACM)
                                                                  │
                                          path-based routing      │
                                ┌─────────────────────────────────┴───────────────┐
                                │  /api/*                          everything else │
                                ▼                                                  ▼
                       ECS Service: server (Express)                  ECS Service: client (Next SSR)
                                │
                                ▼
                       Amazon RDS for PostgreSQL (Multi-AZ)
                       + Secrets Manager · ElastiCache Redis · CloudWatch · ECR · KMS
```

v2 is a **single repository (`portal/`) with two independent applications**:

- **`client/`** — Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui). The existing UI, already moved into `portal/client`. Runs as an **SSR container**. UI/dashboards/forms/analytics/role-based views only.
- **`server/`** — Node.js + Express + TypeScript. **To be built.** Owns auth, authz/RBAC, all business logic, all integrations, email, notifications, analytics, audit logging, background jobs, and webhooks. The **only** tier that touches the database or external systems.

Both run as separate **ECS Fargate services** behind one **Application Load Balancer** that does **path-based routing** (`/api/*` → server, everything else → client). The database moves to **Amazon RDS for PostgreSQL** (Multi-AZ in production). Authentication becomes **Google OAuth (OIDC) only**.

### 1.3 Why pivot

| Driver | v1 limitation | v2 resolution |
|---|---|---|
| **Account isolation** | Vercel is external; no way to satisfy "shared AWS account, zero blast radius." | Dedicated VPC / ECS cluster / RDS / ECR / KMS / IAM, all tagged `app=forge`. |
| **Background work** | No long-running processes; work done on-read or via on-demand endpoints. | Dedicated jobs/worker capability on persistent Fargate tasks + Redis-backed queue. |
| **Integrations** | Bot connections, webhook intake, token refresh awkward in serverless. | Persistent Express server with a clean integrations layer and webhook endpoints. |
| **Separation of concerns** | UI and business logic co-located; hard to reason about trust boundary. | Hard client/server split — the client cannot reach the DB or integrations. |
| **Auth** | Custom credentials = password storage, reset, lockout, breach surface. | Google OAuth (OIDC), institutional `hd` + allowlist; no passwords stored. |
| **Operational control** | Limited network/security posture control on a managed PaaS. | Full VPC, security groups, private subnets, KMS, CloudWatch, WAF. |

---

## 2. Guiding principles

1. **Strict client/server split.** The client renders; the server decides. The client never holds a DB connection, an integration token, or a business rule. All authoritative logic lives in `server/`.
2. **Server is the only trust boundary.** Auth, authz, validation, rate limiting, and audit are enforced server-side. Any check in the client is a **UI hint** and is re-checked on the server.
3. **Isolation by default (zero blast radius).** Because the AWS account is **shared with unrelated services**, every resource this platform creates is dedicated, namespaced (`forge` / `/forge/*` / `/ecs/forge/*`), tagged `app=forge`, and reachable only by IAM principals scoped to *this app's* ARNs. No wildcards, no VPC peering to other apps, no use of the default VPC. See [infra-ecs.md](./infra-ecs.md) and [security.md](./security.md).
4. **Least privilege everywhere.** IAM task roles, security groups, and DB grants grant the minimum required. Secrets are pulled from Secrets Manager at runtime, never baked into images.
5. **Stateless containers, stateful backing services.** ECS tasks hold no durable state; durability lives in RDS, Redis, and S3. Any task can be replaced at any time.
6. **Twelve-factor configuration.** Config via environment and Secrets Manager; identical images promoted across environments; no environment-specific builds.
7. **Defense in depth.** Cloudflare (WAF/DDoS) → ALB (TLS) → security groups → app middleware → DB grants. A failure at one layer is contained by the next.
8. **Observability is not optional.** Structured logs, request IDs, metrics, and audit trails ship to CloudWatch under `/ecs/forge/*`.
9. **Migrations are code.** Schema changes flow through Prisma migrations, reviewed and applied as part of release, never by hand.
10. **No refactoring debt.** The structure is designed so later capabilities (more integrations, more roles, more scopes) are configuration/extension, not re-architecture.

---

## 3. Repository architecture

### 3.1 Model: single repo, two apps

Forge v2 lives in **one repository, `portal/`**, containing **two independent applications** plus shared operational tooling:

- `client/` — the Next.js front end (already present).
- `server/` — the Express API (to be built).

Each app has its **own** `package.json`, `tsconfig.json`, dependency tree, Dockerfile, lint config, and lifecycle. They are deployed as **separate containers** and **scale independently**. They communicate only over HTTP across the ALB.

### 3.2 Why NOT a Turborepo / monorepo toolchain

This is intentionally a **plain single-repo with two apps**, **not** a Turborepo/Nx-style monorepo, and there are **no `apps/` or `packages/` directories**.

| Consideration | Decision |
|---|---|
| **Number of deployables** | Exactly two (client, server). A monorepo task graph adds machinery without payoff at this size. |
| **Shared code** | Minimal and intentional. The contract between the two apps is the **HTTP API**, not a shared TypeScript package. Type-sharing, if needed, is solved with generated API types — not a `packages/` workspace. |
| **Build complexity** | Two Dockerfiles, each building one app. No remote cache, no pipeline graph, no workspace hoisting to reason about. |
| **Cognitive load** | `client/` and `server/` are obvious and self-contained. Contributors do not need to learn a monorepo tool to be productive. |
| **Coupling risk** | A shared `packages/` layer tends to leak business logic into the client over time. Keeping them physically separate enforces the trust boundary. |

> **Rule:** the client/server contract is the **REST API**. Do not introduce a shared `packages/` workspace to share business logic; that would re-couple the tiers we are deliberately splitting.

### 3.3 Directory tree

```
portal/
├── client/                     # Next.js 15 App Router (TS · Tailwind · shadcn) — SSR container
│   ├── app/                    #   App Router routes (route groups: (app), (auth))
│   ├── components/             #   UI + shadcn components
│   ├── lib/                    #   config, labels, nav, rbac (UI hints), session helpers, types, utils
│   ├── public/
│   ├── docs/                   #   client-local notes
│   ├── Dockerfile              #   (added in Dockerize phase) — Next standalone output
│   ├── next.config.ts          #   output: "standalone"
│   ├── package.json
│   └── tsconfig.json
│
├── server/                     # Node.js + Express + TypeScript API — API container (TO BE BUILT)
│   ├── src/                    #   layered app (see §5)
│   ├── prisma/                 #   schema.prisma + migrations (DB owned by the server)
│   ├── Dockerfile              #   (added in Dockerize phase)
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # Architecture & product docs (this file lives here)
│   ├── architecture-v2.md      #   ← THIS FILE
│   ├── architecture.md         #   v1 (historical)
│   ├── infra-ecs.md            #   AWS/ECS provisioning & isolation detail
│   ├── security.md             #   auth, sessions, RBAC, isolation detail
│   ├── integration-setup.md    #   GitHub/Discord/Google/Groq setup
│   ├── repo-guide.html         #   onboarding / repo tour
│   ├── 02_Platform_PRD.md
│   └── 01_RawDocs_Analysis_Report.md
│
├── infra/                      # Infrastructure-as-code (IaC) for the dedicated AWS footprint
│                               #   VPC, ECS, ALB, RDS, ECR, Secrets, IAM, KMS, CloudWatch (see infra-ecs.md)
│
├── docker/                     # Shared docker assets (base images, entrypoints, healthcheck scripts)
│
├── scripts/                    # Operational scripts (db migrate, seed, deploy helpers, local bootstrap)
│
├── .github/                    # CI/CD workflows (build/test/lint/migrate, push to ECR, deploy to ECS)
│
├── docker-compose.yml          # Local dev: client + server + postgres + redis on one network
├── README.md                   # Repo overview & quickstart
└── CLAUDE.md                   # Agent/contributor working agreement for this repo
```

> **Note on Prisma ownership.** In v1 the Prisma schema lived under `client/prisma/`. In v2 the database is owned exclusively by the **server**; the canonical `schema.prisma` and all migrations move to `server/prisma/`. The client retains no Prisma client and no `DATABASE_URL`. See [§11 Migration plan](#11-migration-plan).

---

## 4. Client architecture

### 4.1 Responsibility

The client is **presentation only**: UI, dashboards, forms, analytics views, and **role-based rendering**. It contains **no business logic, no direct integration calls, and no database access**. Every authoritative action goes to the server API.

| In the client | NOT in the client |
|---|---|
| React Server/Client Components, layouts, navigation | Business rules / workflow logic |
| Forms + client-side validation (UX only; re-validated server-side) | Database access / Prisma |
| Role-based UI (show/hide based on session role) | Integration calls (GitHub/Discord/Google/Groq) |
| Calling the server API and rendering responses | Auth decisions / token validation |
| SSR/streaming for fast first paint | Secrets of any kind |

### 4.2 Runtime: Next.js 15 standalone, SSR container

The client runs as a **server-side rendered container**, not a static export.

```ts
// client/next.config.ts
const nextConfig = {
  output: "standalone",   // self-contained server bundle for the Docker image
  // ...
};
```

`output: "standalone"` produces a minimal Node server (`.next/standalone/server.js`) plus only the required `node_modules`, which the Dockerfile copies into a small runtime image. The container serves SSR HTML and static assets and listens on a fixed port (e.g. `3000`) for the ALB target group.

### 4.3 BFF / proxy to the server

The client talks to the server in two ways, both over the ALB:

1. **Browser → server (most reads/writes).** Client components call the API at `NEXT_PUBLIC_API_URL` (typically the same origin, `/api/*`, so the session cookie is sent automatically and CSRF/SameSite protections apply).
2. **Server Components / Route Handlers → server (BFF reads during SSR).** When a page needs data at render time, the Next server fetches from the server API using an **internal base URL** and forwards the incoming session cookie. This keeps secrets out of the browser and lets the client compose server responses for first paint.

```
Browser ──(cookie)──▶ ALB /api/*  ──▶ server (Express)        (client-side fetch)
Next SSR ─(fwd cookie)▶ INTERNAL_API_URL ──▶ server (Express)  (server-side fetch during render)
```

> The client is a **thin BFF/proxy**: it may shape or aggregate server responses for the UI, but it must not implement business rules or call integrations. If it would need a secret or a DB row, it belongs on the server.

### 4.4 Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public base URL the browser uses for API calls (e.g. `https://app.forge.example/api`). |
| `INTERNAL_API_URL` | In-cluster base URL the Next server uses for SSR fetches (service-to-service). |
| `NODE_ENV` | `production` in ECS. |
| `PORT` | Container listen port (e.g. `3000`). |

The client has **no** `DATABASE_URL`, no OAuth client secret, no integration tokens. Any `NEXT_PUBLIC_*` value is, by definition, public.

### 4.5 Folder layout (`client/`)

```
client/
├── app/
│   ├── (app)/                  # authenticated dashboards / role-based views
│   ├── (auth)/                 # login / OAuth callback landing
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # shadcn + composed UI
├── lib/
│   ├── config.ts               # client config (reads NEXT_PUBLIC_*)
│   ├── nav/                    # navigation model
│   ├── labels.ts               # display labels
│   ├── rbac/                   # UI-hint permission helpers (mirror of server policy, non-authoritative)
│   ├── session.ts              # read current session (from server) for rendering
│   ├── types.ts                # shared view types / generated API types
│   └── utils.ts
├── public/
├── next.config.ts              # output: "standalone"
└── package.json
```

> The `client/lib/rbac/*` helpers exist purely to render the right UI for a role. They are **not** an enforcement point; the server re-checks every request (see [§8](#8-rbac-architecture)).

---

## 5. Server architecture

### 5.1 Responsibility

The server is the **system of record and the only trust boundary**. It owns:

- **Authentication** (Google OAuth/OIDC) and **session** management
- **Authorization / RBAC** (role × scope) enforcement
- **Business logic** for all domains
- **Integrations** (GitHub, Discord, Google, Groq)
- **Email**, **notifications**, **analytics**, **audit logging**
- **Background jobs** and **webhook** intake
- **All** database access (Prisma)

### 5.2 Layered design

A strict, one-directional layering keeps responsibilities clean and testable:

```
HTTP request
   │
   ▼
┌──────────┐   ┌─────────────┐   ┌───────────┐   ┌──────────────┐   ┌────────┐   ┌──────────┐
│  Routes  │──▶│ Controllers │──▶│ Services  │──▶│ Repositories │──▶│ Prisma │──▶│ Postgres │
└──────────┘   └─────────────┘   └───────────┘   └──────────────┘   └────────┘   └──────────┘
  (URL +         (parse req,        (business        (data access      (ORM)        (RDS)
   middleware)    shape resp)        rules, RBAC,      per aggregate)
                                     orchestration,
                                     integrations)
```

| Layer | Responsibility | Must not |
|---|---|---|
| **Routes** | Map URL + method to a controller; attach middleware. | Contain logic. |
| **Controllers** | Validate input (Zod), call a service, shape the HTTP response. | Touch the DB or integrations. |
| **Services** | Business rules, RBAC decisions, orchestration, integration calls, transactions. | Build SQL or parse HTTP. |
| **Repositories** | Encapsulate data access for one aggregate; the only callers of Prisma. | Contain business rules. |
| **Prisma** | ORM + migrations. | — |

Integrations (GitHub/Discord/Google/Groq), email, and notifications are **clients used by services**; they are not reachable from controllers or the client tier.

### 5.3 Middleware stack (order matters)

```
request
  │  1. request-id + structured request logging
  │  2. security headers (helmet) + CORS (allow only the client origin)
  │  3. body parsing (json, limits) + cookie parsing
  │  4. session resolution (opaque session id cookie → session in Redis → user)
  │  5. CSRF protection (for state-changing requests)
  │  6. rate limiting (per-IP and per-session; tighter on auth + webhooks)
  │  7. authn guard (is there a valid session?) — except public/auth/health routes
  │  8. authz / RBAC guard (role × scope for the target resource)
  │  9. input validation (Zod schema per route)
  │ 10. → controller → service → repository
  │ 11. centralized error handler (maps errors → safe HTTP responses, logs, audit)
  ▼
response
```

- **Session/auth & RBAC:** detail in [security.md](./security.md); summarized in [§7](#7-security-architecture-summary)–[§8](#8-rbac-architecture).
- **Validation:** **Zod** schemas per endpoint; controllers receive parsed, typed input.
- **Rate limiting:** backed by Redis so limits hold across replicas.
- **Error handling:** a single error handler converts typed application errors into safe responses, writes structured logs, and emits audit entries for security-relevant events.
- **Webhooks:** signature-verified before any processing; see the `webhooks` module.

### 5.4 Module list

Business capability modules (each typically a routes + controller + service + repository slice):

| Module | Owns |
|---|---|
| `auth` | Google OIDC flow, session create/refresh/destroy, `hd` + allowlist gating, CSRF. |
| `users` | User records, allowlist membership, role/scope assignment, profile. |
| `org` | Organizational structure: domains, teams, memberships. |
| `config` | Platform configuration (cycles, settings, feature toggles). |
| `reviews` | Weekly reviews / status submissions and their workflow. |
| `concerns` | Concerns / escalations raised and tracked across the org. |
| `projects` | Project / team delivery data (boards, issues, PRs, deliverables). |
| `integrations` | GitHub, Discord, Google, Groq clients; token storage/refresh; sync. |
| `notifications` | In-app + push notifications. |
| `email` | Transactional email (templating + SMTP/provider). |
| `analytics` | Aggregations and metrics powering dashboards. |
| `audit` | Append-only audit logging of security/state-changing events. |
| `webhooks` | Inbound webhook endpoints (e.g. GitHub) with signature verification. |
| `jobs` | Background jobs / scheduled tasks (Redis-backed queue + worker). |

### 5.5 Folder layout (`server/src/`)

```
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
    ├── index.ts                  # bootstrap: load config/secrets, build app, listen
    ├── app.ts                    # express app: mounts middleware + routers
    ├── config/                   # typed config + secret loading (Secrets Manager)
    ├── middleware/
    │   ├── requestId.ts
    │   ├── logging.ts
    │   ├── security.ts           # helmet, cors
    │   ├── session.ts            # session resolution
    │   ├── csrf.ts
    │   ├── rateLimit.ts
    │   ├── authn.ts              # require valid session
    │   ├── authz.ts              # RBAC role × scope guard
    │   ├── validate.ts           # Zod validation helper
    │   └── errorHandler.ts
    ├── modules/
    │   ├── auth/        { routes, controller, service }          # OIDC + sessions
    │   ├── users/       { routes, controller, service, repository }
    │   ├── org/         { ... }
    │   ├── config/      { ... }
    │   ├── reviews/     { ... }
    │   ├── concerns/    { ... }
    │   ├── projects/    { ... }
    │   ├── integrations/{ github/, discord/, google/, groq/, service }
    │   ├── notifications/{ ... }
    │   ├── email/       { templates/, service }
    │   ├── analytics/   { ... }
    │   ├── audit/       { service, repository }
    │   ├── webhooks/    { routes, controller, verify }
    │   └── jobs/        { queue, worker, schedules }
    ├── rbac/
    │   ├── permissions.ts        # role → permission map (authoritative)
    │   ├── scope.ts              # GLOBAL/DOMAIN/TEAM/SELF resolution
    │   └── policy.ts             # can(role, scope, action, resource)
    ├── lib/
    │   ├── prisma.ts             # Prisma client singleton
    │   ├── redis.ts              # Redis client (sessions, cache, queue)
    │   ├── http.ts               # outbound HTTP helpers for integrations
    │   └── errors.ts             # typed application errors
    └── health/                   # /health, /ready for ALB + ECS health checks
```

---

## 6. Request & data flow

### 6.1 Page load (SSR)

```
1. Browser ──▶ Cloudflare ──▶ Route 53 ──▶ ALB
2. ALB: path is NOT /api/*  ──▶ client (Next SSR) target group
3. Next server renders the route:
      - reads session cookie
      - for data it needs at render time, fetches INTERNAL_API_URL/... 
        forwarding the session cookie  ──▶ ALB /api/*  ──▶ server
      - server resolves session, runs RBAC, returns JSON
4. Next composes HTML + streams to the browser
5. Browser hydrates; later interactions call NEXT_PUBLIC_API_URL/api/* directly
```

```
┌─────────┐   ┌────────────┐   ┌─────┐   ┌──────────────┐   ┌──────────────┐   ┌──────┐
│ Browser │──▶│ Cloudflare │──▶│ ALB │──▶│ client (SSR) │──▶│ server (API) │──▶│ RDS  │
└─────────┘   └────────────┘   └─────┘   └──────────────┘   └──────────────┘   └──────┘
                                  │ path !/api/*                  ▲
                                  └───────────────────────────────┘ (SSR fetch, fwd cookie)
```

### 6.2 API call (client-side mutation)

```
1. Browser fetch ──▶ Cloudflare ──▶ ALB, path = /api/* 
2. ALB ──▶ server (Express) target group
3. Middleware: request-id → log → security/cors → cookies →
   session(Redis) → CSRF → rate-limit → authn → authz(role×scope) → Zod validate
4. Controller → Service (business rule + maybe integration call) → Repository → Prisma → RDS
5. Service writes audit entry; may enqueue a background job; may emit a notification
6. Response ──▶ ALB ──▶ Cloudflare ──▶ Browser
```

```
Browser ─▶ ALB(/api/*) ─▶ [reqId·log·cors·cookie·SESSION·CSRF·rate·authn·AUTHZ·validate]
                                                                      │
                                       Controller ─▶ Service ─▶ Repository ─▶ Prisma ─▶ RDS
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    ▼                  ▼                  ▼
                               Integrations          Audit            Jobs/Notify
                            (GitHub/Discord/         (append)         (Redis queue)
                             Google/Groq)
```

### 6.3 Client → server auth/session

```
LOGIN:
  Browser ──▶ /api/auth/google            (server starts OIDC authorization-code flow)
          ◀── 302 to Google with state+nonce+PKCE
  Browser ──▶ Google (user consents)
          ◀── 302 back to /api/auth/google/callback?code=...
  server: exchange code → validate ID token → check hd (hosted domain)
          → check email exists in users allowlist
          → create server-side session in Redis
          ◀── Set-Cookie: opaque session id (httpOnly · Secure · SameSite)

EVERY REQUEST:
  Browser sends cookie ──▶ server resolves session id → loads session → loads user/role/scope
  rolling timeout refreshed; idle + absolute timeouts enforced; CSRF checked on writes

LOGOUT:
  Browser ──▶ /api/auth/logout → server destroys session in Redis, clears cookie
```

The **client never sees or handles tokens**. It only ever receives an opaque, httpOnly session cookie it cannot read. Full flow, timeout values, and CSRF strategy: [security.md](./security.md).

---

## 7. Security architecture (summary)

> Authoritative detail lives in **[security.md](./security.md)**. This is a summary.

- **Authentication — Google OAuth (OIDC) ONLY.** No email/password, no signup, no custom credentials. The **server** runs the authorization-code flow (with state + nonce + PKCE), validates the ID token, and gates access on **both**:
  1. the Google **`hd`** hosted-domain claim (e.g. `rishihood.edu.in`), and
  2. the email **already existing** in the `users` table (allowlist).

  Unknown emails are **rejected** — there is no self-service account creation.
- **Sessions — server-side (Redis preferred).** On success the server stores the session server-side and issues an **opaque session id** in a **secure, httpOnly, SameSite** cookie. **Rolling + idle + absolute** timeouts apply; token refresh is handled **server-side**; **CSRF** protection guards state-changing requests. The browser never holds an access/refresh token.
- **Authorization — RBAC role × scope**, enforced server-side at the **API, service, and DB-query** layers. Client checks are UI hints only. See [§8](#8-rbac-architecture).
- **Account isolation (shared AWS account).** The platform runs in a **dedicated, isolated footprint** with zero blast radius into other services in the account. Dedicated VPC, ECS cluster, RDS, ECR, security groups; IAM scoped to this app's resource ARNs + tag conditions (**no wildcards**); Secrets Manager namespaced `/forge/*`; CloudWatch namespaced `/ecs/forge/*`; a dedicated **KMS CMK**; all resources tagged `app=forge`; **no VPC peering** to other apps. See [infra-ecs.md](./infra-ecs.md) and [security.md](./security.md).
- **Defense in depth.** Cloudflare WAF/DDoS → ALB TLS (ACM) → security groups → app middleware (helmet, CORS, rate limiting) → DB grants + `sslmode=require`.
- **Secrets** are pulled from Secrets Manager at runtime (OAuth client secret, DB credentials, integration tokens, session signing material) — never committed, never in images, never in the client.
- **Audit** logging records security-relevant and state-changing events (append-only) for traceability.

---

## 8. RBAC architecture

> Authoritative policy code and matrix live in **[security.md](./security.md)** and `server/src/rbac/`. This summarizes the model.

### 8.1 Model: `permission = Role × Scope`

Authorization answers two questions together: **what** may a role do, and **to which records**? We model them separately and combine them in a policy function `can(role, scope, action, resource)`.

### 8.2 Roles — FIVE

| Role | Summary |
|---|---|
| **Admin** | Full platform administration. |
| **LCC** | Learning/Career Cell oversight across the drive. |
| **Teacher** | Owns a domain; oversees its teams/mentors. |
| **Mentor** | **Student Mentor** who *also leads the team* (mentee management + team delivery). |
| **Mentee** | Student participant; submits own updates and feedback. |

> ⚠️ **Team Lead role discrepancy (must read).** The v2 refactor prompt re-listed **"Team Lead"** as a 6th role. This conflicts with a **prior explicit product decision** that **merged Team Lead into Mentor** — the **Student Mentor leads the team**, so there is no separate Team Lead. This is already reflected in the codebase (`client/lib/rbac/scope.ts`: *"the Student Mentor leads the team"*; `permissions.ts`: *"The Student Mentor also leads the team (no separate Team Lead role)"*).
>
> **We ship FIVE roles.** Re-adding Team Lead is a **small RBAC-config change** (one role entry + permission/scope mapping) **if the team confirms** it is wanted. See [§12](#12-open-questions--decisions-to-confirm).

### 8.3 Scopes & hierarchy

```
GLOBAL                     ← whole platform
  └─ DOMAIN:<id>           ← one domain (a Teacher's area)
       └─ TEAM:<id>        ← one team within a domain (led by its Mentor)
            └─ SELF        ← the acting user's own records
```

A grant at a higher scope implies authority over the records nested beneath it (subject to the role's permissions). `SELF` is the narrowest scope.

| Scope | Means |
|---|---|
| `GLOBAL` | All records across the platform. |
| `DOMAIN:<id>` | Records belonging to a specific domain. |
| `TEAM:<id>` | Records belonging to a specific team. |
| `SELF` | Only the acting user's own records. |

### 8.4 Compact permission matrix (illustrative)

> Indicative summary; the authoritative map is `server/src/rbac/permissions.ts` and [security.md](./security.md).

| Capability \ Role | Admin | LCC | Teacher | Mentor | Mentee |
|---|:---:|:---:|:---:|:---:|:---:|
| Platform config (`config:edit`) | ✅ GLOBAL | — | — | — | — |
| Manage users / roles | ✅ GLOBAL | read | — | — | — |
| Manage domains | ✅ GLOBAL | ✅ GLOBAL | ✅ DOMAIN (own) | — | — |
| Manage teams (`team:manage`) | ✅ GLOBAL | ✅ GLOBAL | ✅ DOMAIN | ✅ TEAM (own) | — |
| Weekly review L3 (`weeklyReview:l3Submit`) | ✅ | — | ✅ DOMAIN | ✅ TEAM | — |
| Mentor status (`mentorStatus:submit`) | ✅ | — | — | ✅ TEAM | — |
| Assign tasks (`task:assign`) | ✅ | — | ✅ DOMAIN | ✅ TEAM | — |
| Submit own update (`menteeUpdate:submit`) | — | — | — | — | ✅ SELF |
| Mentor feedback (`mentorFeedback:submit`) | — | — | — | — | ✅ SELF |
| Raise/track concerns | ✅ GLOBAL | ✅ GLOBAL | ✅ DOMAIN | ✅ TEAM | ✅ SELF |
| View analytics | ✅ GLOBAL | ✅ GLOBAL | ✅ DOMAIN | ✅ TEAM | ✅ SELF |

*(Legend: scope shown next to ✅ indicates the breadth at which the role holds the capability.)*

### 8.5 Enforcement

RBAC is enforced **server-side at three layers**; the client only renders hints.

```
API layer:     authz middleware rejects the request if can(role,scope,action) is false
Service layer: business methods re-assert authority and resolve the caller's scope
DB-query layer: repositories constrain every query by the caller's scope
                (e.g. WHERE domainId IN (...granted...) / teamId = ... / userId = self)
```

This means even a request that slips past one check is constrained by the next, and the **database query itself** is scoped — a Mentor can never read another team's rows, regardless of the request shape.

---

## 9. Infrastructure architecture

> Authoritative provisioning, isolation rules, sizing, and IaC detail live in **[infra-ecs.md](./infra-ecs.md)**. This is the topology summary.

### 9.1 Topology

```
                            Internet
                               │
                               ▼
                    ┌────────────────────┐
                    │     Cloudflare      │   DNS proxy · WAF · DDoS
                    └─────────┬───────────┘
                              ▼
                    ┌────────────────────┐
                    │      Route 53       │   DNS (hosted zone)
                    └─────────┬───────────┘
                              ▼
                 ┌──────────────────────────┐
                 │  Application Load Balancer │  TLS termination (ACM)
                 │      (public subnets)      │  path-based routing
                 └───────┬───────────┬────────┘
              /api/*     │           │  everything else
                         ▼           ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │  ECS Service: server  │  │  ECS Service: client  │   ← ECS Fargate cluster
        │   Express API (TS)    │  │   Next.js SSR         │     (private subnets)
        └──────────┬───────────┘  └──────────────────────┘
                   │
       ┌───────────┼─────────────────────────────────────────┐
       ▼           ▼                 ▼                 ▼
┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  RDS for   │ │  ElastiCache │ │   Secrets    │ │  CloudWatch  │
│ PostgreSQL │ │    Redis     │ │   Manager    │ │   Logs/Metrics│
│ (Multi-AZ, │ │ (sessions/   │ │  /forge/*    │ │ /ecs/forge/* │
│  private)  │ │  cache/jobs) │ └──────────────┘ └──────────────┘
└────────────┘ └──────────────┘
       ▲
       │   images
┌──────┴───────┐
│     ECR      │   (client + server repos)
└──────────────┘

VPC: dedicated (NOT default) · public subnets (ALB, NAT) · private subnets (ECS, RDS, Redis)
KMS: dedicated CMK · Tags: app=forge on every resource · No VPC peering to other apps
```

### 9.2 Component list

| Component | Role | Isolation note |
|---|---|---|
| **Cloudflare** | DNS proxy, WAF, DDoS protection in front of everything. | — |
| **Route 53** | Authoritative DNS for the platform domain. | Dedicated hosted zone. |
| **ALB** | TLS (ACM) + **path-based routing** (`/api/*` → server, else → client). | In dedicated VPC public subnets. |
| **ECS (Fargate) cluster** | Runs two services: **client** (Next SSR) + **server** (Express API). | **Dedicated** cluster for `forge`. |
| **Amazon RDS for PostgreSQL** | Primary datastore; **Multi-AZ** in prod; encrypted at rest (KMS); `sslmode=require`. | Private subnet; dedicated instance + SG. |
| **ElastiCache Redis** | Sessions (preferred), cache, background-job queue. | Private subnet; dedicated SG. |
| **ECR** | Container image registry (client + server repos). | Dedicated repos. |
| **Secrets Manager** | Runtime secrets (DB creds, OAuth secret, integration tokens, session keys). | Namespaced **`/forge/*`**. |
| **CloudWatch** | Logs, metrics, alarms. | Namespaced **`/ecs/forge/*`**. |
| **KMS** | Encryption keys (RDS, secrets, logs). | **Dedicated CMK**. |
| **VPC** | Network boundary; public (ALB/NAT) + private (ECS/RDS/Redis) subnets; NAT for egress. | **Dedicated VPC**, not default/shared; **no peering** to other apps. |
| **IAM** | Task execution + task roles, scoped to this app's ARNs + `app=forge` tag conditions. | **No wildcards.** |

### 9.3 Isolation theme (critical)

Because the AWS account is **shared with unrelated services**, the entire footprint above is **dedicated to `forge`** with **zero blast radius** into other apps: dedicated VPC / ECS / RDS / ECR / security groups, IAM scoped to this app's resource ARNs and tag conditions only, namespaced secrets and logs, a dedicated KMS CMK, every resource tagged `app=forge`, and no VPC peering to other apps. Authoritative rules and the IAM policy templates: **[infra-ecs.md](./infra-ecs.md)** and **[security.md](./security.md)**.

---

## 10. What changed from v1

| Concern | v1 (Vercel / serverless) | v2 (AWS ECS / client-server split) |
|---|---|---|
| **Topology** | Single Next.js app on Vercel | Cloudflare → Route 53 → ALB → 2 ECS services → RDS |
| **App shape** | One deployable (UI + API + logic) | Two deployables: `client/` (Next SSR) + `server/` (Express) |
| **Compute** | Serverless/edge functions (short-lived) | Long-lived Fargate containers |
| **API** | Next.js Route Handlers (`app/api/**`) + Server Actions | Express REST API behind `/api/*` |
| **Business logic** | In the Next app (`lib/services`, route handlers) | In `server/` services only |
| **DB** | Neon serverless Postgres | Amazon RDS for PostgreSQL (Multi-AZ, KMS, private) |
| **Prisma location** | `client/prisma/` | `server/prisma/` (server owns the DB) |
| **Auth** | Auth.js (NextAuth) **Credentials** (email + password, Argon2id) | **Google OAuth (OIDC) only**; `hd` + allowlist; no passwords |
| **Sessions** | Stateless JWT in cookie | **Server-side** sessions (Redis), opaque cookie, server refresh |
| **RBAC** | Policy code used for **UI rendering**, no enforcement yet | Enforced server-side at API + service + DB-query layers |
| **Integrations** | Called on-demand from route handlers/actions | Encapsulated in `server/` integrations module |
| **Background work** | On-read / on-demand sync endpoints (no workers) | Redis-backed queue + worker (`jobs` module) |
| **Webhooks** | Route handlers | `server/` webhooks module with signature verification |
| **Secrets** | Vercel env | Secrets Manager `/forge/*` |
| **Logs/metrics** | Vercel | CloudWatch `/ecs/forge/*` |
| **Network** | Managed PaaS | Dedicated VPC, SGs, private subnets, NAT |
| **Edge protection** | Vercel defaults | Cloudflare WAF/DDoS + ALB TLS (ACM) |
| **Isolation** | N/A (external) | Dedicated, namespaced, tagged `app=forge`; zero blast radius |

---

## 11. Migration plan

Phased and **dependency-ordered** (no calendar dates). Each phase should be releasable/reviewable on its own.

### Phase A — Repository structure *(done)*
- Single repo `portal/` established with the **two-app** layout.
- Existing UI **moved into `client/`**.
- Root scaffolding present: `docs/`, `infra/`, `docker/`, `scripts/`, `.github/`, `docker-compose.yml`, `README.md`, `CLAUDE.md`.

### Phase B — Scaffold the server
- Create `server/` (Express + TS): app bootstrap, layered structure (`routes → controllers → services → repositories → prisma`), middleware stack (logging, security, validation/Zod, rate limit, error handler), health endpoints.
- **Move Prisma** schema + migrations from `client/prisma/` to `server/prisma/`; the server becomes the sole DB owner. Remove Prisma/`DATABASE_URL` from the client.
- Stand up `docker-compose.yml` for local dev (client + server + postgres + redis).

### Phase C — Move business logic + integrations to the server
- Port domain logic (users, org, config, reviews, concerns, projects, analytics, audit) into `server/` modules behind the REST API.
- Move all integrations (GitHub, Discord, Google, Groq), email, notifications, and webhook intake into the server.
- Repoint the client to call the API via `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL`; strip any business logic/DB access from the client (keep RBAC helpers as UI hints only).
- Add the `jobs` module (Redis queue + worker) for background/scheduled work.

### Phase D — Wire Google OAuth + server-side sessions
- Implement the OIDC authorization-code flow in the server `auth` module: `hd` hosted-domain gate **and** users-table allowlist; reject unknown emails.
- Server-side sessions in Redis; opaque httpOnly/Secure/SameSite cookie; rolling + idle + absolute timeouts; server-side refresh; CSRF protection.
- Wire RBAC enforcement (API + service + DB-query) using `server/src/rbac/`. Detail per [security.md](./security.md).

### Phase E — Dockerize
- `client/Dockerfile` using Next.js **standalone** output; `server/Dockerfile` for the Express API; shared assets in `docker/`.
- Verify the full stack via `docker-compose` (client + server + postgres + redis).
- CI in `.github/` builds, tests, lints, runs migrations, and pushes images to **ECR**.

### Phase F — Provision AWS + deploy
- Provision the **dedicated, isolated** footprint from `infra/` per [infra-ecs.md](./infra-ecs.md): VPC (public/private subnets, NAT), ECS cluster, ALB (ACM TLS + path routing), RDS (Multi-AZ, KMS, private), ElastiCache Redis, ECR, Secrets Manager `/forge/*`, CloudWatch `/ecs/forge/*`, KMS CMK, IAM (scoped, no wildcards), all tagged `app=forge`.
- Configure Cloudflare → Route 53 → ALB; deploy both ECS services; run DB migrations; smoke-test auth, RBAC, and integrations.

---

## 12. Open questions / decisions to confirm

1. **Team Lead role (HIGH — needs product confirmation).** The refactor prompt re-listed **Team Lead** as a 6th role, but the prior explicit decision **merged Team Lead into Mentor** (the Student Mentor leads the team). **We are shipping FIVE roles** (Admin, LCC, Teacher, Mentor, Mentee). If the team wants Team Lead back, it is a **small RBAC-config change** (add the role + its permission/scope mapping in `server/src/rbac/permissions.ts` and `scope.ts`). **Confirm: keep 5, or restore 6?** See [§8.2](#82-roles--five).
2. **Redis (sessions/cache/jobs).** Confirmed as the **preferred** session store and required for the job queue and cross-replica rate limiting. Confirm ElastiCache is provisioned in all environments (it is marked "optional" at the account level but is effectively required for sessions + jobs at scale).
3. **Hosted-domain allowlist.** Confirm the exact set of accepted Google `hd` values (e.g. `rishihood.edu.in`) and whether more than one domain is permitted.
4. **Type sharing between apps.** Confirm the approach for sharing request/response types (generate API types from the server vs. hand-maintained types in `client/lib/types.ts`) — without introducing a shared `packages/` workspace (see [§3.2](#32-why-not-a-turborepo--monorepo-toolchain)).
5. **IaC tool for `infra/`.** Confirm the tooling (e.g. Terraform vs. CDK) — owned by [infra-ecs.md](./infra-ecs.md).
6. **Environments.** Confirm the environment set (e.g. dev / staging / prod) and whether each gets its own dedicated VPC/cluster/RDS or shares within the isolated `forge` boundary.
7. **Custom domain + cutover.** Confirm the production hostname(s) and the Cloudflare/Route 53 cutover strategy from the existing Vercel deployment.

---

> **Cross-references:** [infra-ecs.md](./infra-ecs.md) · [security.md](./security.md) · [integration-setup.md](./integration-setup.md) · [repo-guide.html](./repo-guide.html) · [architecture.md (v1)](./architecture.md) · [02_Platform_PRD.md](./02_Platform_PRD.md)
