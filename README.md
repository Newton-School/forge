# Forge — Profile Building Drive Management Platform

A production, multi-domain platform to run a university **Profile Building Drive** — students, mentors, teachers, the LCC, and admins on one platform. Built as a **client + server split deployed on AWS ECS**.

```
Internet → Cloudflare → Route 53 → Application Load Balancer
        → AWS ECS (Fargate): client (Next.js) + server (Express) → RDS PostgreSQL
```

> **Architecture v2.** This is **not** a Vercel/serverless app. See [`docs/architecture-v2.md`](docs/architecture-v2.md), [`docs/infra-ecs.md`](docs/infra-ecs.md), [`docs/security.md`](docs/security.md), and the onboarding guide [`docs/repo-guide.html`](docs/repo-guide.html).

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
#   server → http://localhost:4000/api/health
```

Or run each app directly:

```bash
cd client && npm install && npm run dev     # http://localhost:3000
cd server && cp .env.example .env && npm install && npm run dev   # http://localhost:4000
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
