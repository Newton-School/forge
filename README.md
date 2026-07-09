# Forge — Profile Building Drive Management Platform

A production, multi-domain platform to run a university **Profile Building Drive** — students, mentors, teachers, the LCC, and admins on one platform. Built as a **client + server split deployed on AWS ECS**.

```
Internet → Cloudflare → Route 53 → Application Load Balancer
        → AWS ECS (Fargate): client (Next.js) + server (Express) → RDS PostgreSQL
```

> **Architecture v2.** AWS ECS is the **target** topology (see [`docs/architecture-v2.md`](docs/architecture-v2.md), [`docs/infra-ecs.md`](docs/infra-ecs.md), [`docs/security.md`](docs/security.md), and [`docs/repo-guide.html`](docs/repo-guide.html)). The current **live preview** runs on Render (backend) + Vercel (frontend) — see below.

---

## Live deployment

| Surface | URL |
|---|---|
| **Frontend** (Vercel) | https://forge.taj.works |
| **Backend** (Render) | https://forge.server.taj.works |
| **Health check** | https://forge.server.taj.works/api/health |

Frontend and backend are **subdomains of the same site** (`taj.works`), so session cookies are same-site (`SameSite=Lax`, `Secure`) and the env just points them at each other. **Secrets (DB, Redis, OAuth, SMTP) live in each host's env settings — never in git.**

**Render — backend env**

| Var | Value |
|---|---|
| `APP_BASE_URL` | `https://forge.taj.works` (frontend origin: CORS, post-login redirect, email links) |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://forge.server.taj.works/api/auth/google/callback` |
| `GITHUB_OAUTH_REDIRECT_URI` | `https://forge.server.taj.works/api/integrations/github/oauth/callback` |
| `REDIS_URL` | Upstash `rediss://…` (secret) |
| `DATABASE_URL` · `DIRECT_URL` · `SESSION_SECRET` · `GOOGLE_OAUTH_*` · `GITHUB_*` · `SMTP_*` | secrets |

**Vercel — frontend env**

| Var | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://forge.server.taj.works/api` |
| `NEXT_PUBLIC_APP_MODE` | `production` (must be `NEXT_PUBLIC_*` so the browser sees it — plain `APP_MODE` is server-only) |

> After deploying, add both production URLs to the provider consoles: **Google OAuth** (authorized redirect URI = the backend `…/api/auth/google/callback`; authorized JS origin = the backend) and any **GitHub OAuth** app callback. Email links resolve from `APP_BASE_URL`, so setting it to the Vercel URL makes onboarding/notification links point at the live app.

---

## Repository (single repo, two apps)

```
portal/
├── client/            # Next.js (App Router, TS, Tailwind, shadcn) — UI only
├── server/            # Node.js + Express + TS — all business logic, auth, integrations
├── docs/              # architecture-v2 · infra-ecs · security · integration-setup · repo-guide.html · PRD
├── infra/             # ecs/ task defs · aws/ IAM · terraform/ (placeholder)
├── docker/            # client.Dockerfile · server.Dockerfile · nginx/
├── scripts/
├── .github/workflows/ # deploy.yml (build → ECR → ECS)
├── docker-compose.yml
└── CLAUDE.md          # engineering source of truth
```

Not a Turborepo — `client/` and `server/` are independent apps in one repo.

---

## Key decisions

| Area | Decision |
|---|---|
| **Deploy** | AWS ECS Fargate behind Cloudflare → Route 53 → ALB; RDS PostgreSQL; ECR · Secrets Manager · CloudWatch · (Redis) |
| **Frontend** | Next.js — UI only. Never touches the DB or external APIs directly. |
| **Backend** | Express + TS — owns auth, RBAC, business logic, integrations, email, notifications, analytics, audit, jobs, webhooks |
| **Auth** | **Google OAuth (OIDC) only.** No email/password, no signup. Gate = Google hosted-domain (`rishihood.edu.in`) **and** email pre-existing in the DB (allowlist). Server-side sessions + secure cookies. |
| **RBAC** | `role × scope` (Admin/LCC/Teacher/Mentor/Mentee × GLOBAL/DOMAIN/TEAM/SELF), enforced server-side at route + policy + query layers |
| **AWS isolation** | The account hosts **other services** — this platform is fully isolated (dedicated VPC/SG/IAM/Secrets/KMS, least privilege, no peering) for **zero blast radius** |

---

## Getting started (local)

Requires Docker, Node ≥ 20.9.

```bash
# Full stack (client + server + postgres + redis)
docker compose up --build
#   client → http://localhost:3000
#   server → http://localhost:8000/api/health
```

Or run each app directly:

```bash
cd client && npm install && npm run dev     # http://localhost:3000
cd server && cp .env.example .env && npm install && npm run dev   # http://localhost:8000
```

Fill credentials per [`docs/integration-setup.md`](docs/integration-setup.md). In production, secrets come from **AWS Secrets Manager** — never commit them.

---

## Status

- **Client UI:** built (dashboards, flows, modals, domain filters) on a file-based demo dataset; runs with `APP_MODE=presentation`.
- **Server:** foundation scaffold (security baseline + `/api/health`); business logic, Google OAuth, RBAC, integrations are the Phase 2 build-out.
- **Infra:** ECS task defs, scoped IAM, Dockerfiles, compose, and CI are in place as design + working local stack; AWS provisioning is the deploy step.

See [`docs/architecture-v2.md` → Migration plan](docs/architecture-v2.md) for the path to production.

---

*Internal project — all rights reserved.*
