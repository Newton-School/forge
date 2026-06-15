# Forge Server (Express + TypeScript)

The backend. **All** authentication, authorization (RBAC), business logic, integrations (GitHub/Discord/Google/Groq), email, notifications, analytics, audit logging, background jobs, and webhooks live here. The client (`../client`) only renders UI and calls this server's API.

> Phase 2 build-out. This is the foundation scaffold (security baseline + `/api/health`). See [`../docs/architecture-v2.md`](../docs/architecture-v2.md) and [`../docs/security.md`](../docs/security.md).

## Run (local)
```bash
cp .env.example .env       # fill values (see ../docs/integration-setup.md)
npm install
npm run dev                # http://localhost:4000/api/health
```
Or via the full stack: `docker compose up` from `portal/`.

## Layered architecture (`src/`)
```
src/
├── index.ts            entrypoint + security middleware
├── config/             env loading & validation (Zod)
├── auth/               Google OIDC flow, session management
├── middleware/         requireAuth · rbac(can) · validate(zod) · rateLimit · errorHandler · requestLog
├── routes/             HTTP routing only
├── controllers/        request/response shaping
├── services/           business logic (the only place rules live)
├── repositories/       Prisma data access — scope-filtered queries
├── integrations/       github · discord · calendar · groq (server-only)
├── jobs/               schedulers, webhook processors
├── lib/                rbac (roles, permissions, can(), scopeWhere), audit, mailer
└── prisma/             schema + migrations (or shared with client/prisma)
```

## Rules
- **Every** request that isn't `/api/auth/*` or a signature-verified webhook is gated by `requireAuth` + an RBAC check.
- **Every** DB query is scope-filtered (domain/team/self) — see `docs/security.md`.
- Secrets come from the environment (local `.env`) or AWS Secrets Manager (prod). Never commit secrets.
- Validate all input with Zod at the controller boundary; audit every privileged action.
