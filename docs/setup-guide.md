# Setup Guide — Forge (portal)

## 1. Prerequisites
- **Node.js ≥ 20.9** (Next.js 16 minimum; Node 18 unsupported).
- **npm** (repo uses `package-lock.json`).
- A **Neon Postgres** database (free tier) — a pooled connection string.
- (Later phases) GitHub OAuth app, Discord app/bot, Google Cloud OAuth — see [integration-setup.md](./integration-setup.md).

## 2. Local setup
```bash
cd portal
npm install
cp .env.example .env          # then fill in values (see §4)
npm run dev                   # Turbopack dev server → http://localhost:3000
```
> Next.js 16 uses **Turbopack by default** for `dev` and `build` — no `--turbopack` flag needed.

### Useful scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npx prisma generate` | Generate Prisma client (Phase 3) |
| `npx prisma migrate dev` | Run migrations against `DIRECT_URL` (Phase 3) |
| `npx prisma studio` | Inspect DB (Phase 3) |

## 3. Phase 1 reality check
- This phase is **UI + architecture + mock data**. The app runs **without a database** — dashboards read from `lib/mock/*`.
- A **dev-only Role Switcher** in the top bar lets you preview all six role dashboards. No login is enforced yet.
- Prisma schema exists (`prisma/schema.prisma`) as a **design artifact**; you don't need to migrate it to view the UI.

## 4. Environment variables
Copy `.env.example` → `.env`. Key groups:
- **Database:** `DATABASE_URL` (pooled, runtime), `DIRECT_URL` (direct, migrations).
- **Auth:** `AUTH_SECRET`, `AUTH_URL`, `APP_URL` (Phase 3).
- **AI:** `GROQ_API_KEY`.
- **Email (Nodemailer):** `SMTP_*`.
- **Integrations:** `GITHUB_*`, `DISCORD_*`, `GOOGLE_*` (Phase 2/3).
> The committed `.env` currently uses `DB_URL` — **standardize to `DATABASE_URL`** (add `DIRECT_URL` for migrations). The existing `DB_URL`/`GROQ_API_KEY` values are live secrets; **rotate them** before any public deployment since they were shared in chat.

## 5. Database connection (Neon + serverless)
- Runtime uses the **pooled** host (`...-pooler...`) to survive many concurrent serverless functions.
- Migrations use the **direct** host (`DIRECT_URL`) — pooled connections can't run DDL reliably.
- `sslmode=require` is mandatory for Neon.

## 6. Deploying to Vercel (Free Tier)
1. Push `portal/` to a GitHub repo.
2. In Vercel: **New Project** → import the repo → **Root Directory = `portal`**.
3. Framework preset: **Next.js** (auto-detected). Build command/output are default.
4. Add **Environment Variables** (Production + Preview) — everything from `.env` **except** never commit secrets; paste them into Vercel's encrypted env UI.
5. Set `AUTH_URL` / `APP_URL` to the deployed URL.
6. Deploy. Vercel builds with Turbopack automatically.

### Free-tier guardrails
- No background workers / always-on processes — all work is request- or webhook-triggered.
- Use **at most one** lightweight Vercel Cron (daily rollup/flags) if needed; prefer webhooks for real-time signals.
- Keep serverless function execution short; offload nothing to long-lived sockets.
- Neon pooled connection avoids connection exhaustion under serverless fan-out.

## 7. Troubleshooting
- **`Module not found: fs` (or other Node core) in client code** — Turbopack: refactor the import out of client components, or use `turbopack.resolveAlias` in `next.config.ts`.
- **Build fails citing a webpack config** — Next 16 builds with Turbopack; a plugin may be injecting webpack config. Remove it or run `next build --webpack`.
- **Prisma connection errors on Vercel** — ensure `DATABASE_URL` is the **pooled** URL and `DIRECT_URL` is set for migrations.
