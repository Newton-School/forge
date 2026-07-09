# Phase 5 — Live Stack Runbook

How to stand up the full Forge stack locally and **exercise the integrations end-to-end** (Google login → connect a repo → see the live dashboard → emails → webhooks). This is the part that can't be done without a running stack; follow it on your machine and report anything that breaks.

> Everything the frontend renders has a matching server endpoint and the data contract is unified (Phase 5 wiring). Flipping `APP_MODE=production` makes the dashboards call the real API.

---

## 0. Prerequisites
- Docker (for Postgres + Redis), Node 20+ , and the repo cloned.
- A Google OAuth client, the `lcc-ai-nst` GitHub OAuth App, SMTP creds, and (optional) the reader PAT — the same secrets from `docs/github-setup.html` and the onboarding work.
- **Move the repo out of iCloud** if it's under `com~apple~CloudDocs` — iCloud sync corrupts `.next`/`node_modules`/`.git` and causes the lock/`.next` issues seen earlier.

## 1. Bring up Postgres + Redis
```bash
cd portal
docker compose up -d postgres redis     # or: docker compose up -d (also builds app containers)
```

## 2. Server env (`portal/server/.env`)
Copy `server/.env.example` → `server/.env` and fill:
```
DATABASE_URL=postgresql://forge:forge@localhost:5432/forge?schema=public
DIRECT_URL=postgresql://forge:forge@localhost:5432/forge?schema=public
REDIS_URL=redis://localhost:6379
SESSION_SECRET=<32+ chars>            # openssl rand -hex 32
SESSION_ABSOLUTE_HOURS=24

GOOGLE_OAUTH_CLIENT_ID=...            # login
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
ALLOWED_HOSTED_DOMAIN=rishihood.edu.in

GITHUB_ORG=newton-school-ai           # AI org mode
GITHUB_API_TOKEN=...                  # fine-grained org PAT
GITHUB_WEBHOOK_SECRET=...             # openssl rand -hex 32 (org + repo webhooks)
GITHUB_OAUTH_CLIENT_ID=...            # lcc-ai-nst OAuth App (Connect)
GITHUB_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_REDIRECT_URI=http://localhost:8000/api/integrations/github/oauth/callback
GITHUB_READER_LOGIN=lcc-ai-nst
GITHUB_READER_TOKEN=ghp_...           # classic PAT, public_repo (rate limit + collaborators)

SMTP_HOST=smtp.gmail.com              # email (onboarding)
SMTP_PORT=587
SMTP_USER=learnercareercouncil@nst.rishihood.edu.in
SMTP_PASS=<16-char app password>
SMTP_FROM=Learner Career Council (LCC) <learnercareercouncil@nst.rishihood.edu.in>
```

## 3. Apply the schema + seed
```bash
cd portal/server
npx prisma db push          # creates all tables incl. Repository / RepoCollaborator / RepoBranch / RepoRelease
npm run seed                # domains (AI/ML/SDSE/DVA) + allowlisted demo users
```
> The seed's allowlisted emails are the only ones that can log in. Add your own email to `prisma/seed.ts` (or create a user via the Admin UI once logged in as the seeded admin).

## 4. Public tunnel for webhooks (GitHub can't reach localhost)
```bash
npx smee-client --url https://smee.io/<your-channel> --target http://localhost:8000/api/integrations/github/webhook
```
Use the smee URL as the webhook payload URL (the Connect flow uses `GITHUB_OAUTH_REDIRECT_URI`'s origin — for local webhook delivery, point the OAuth redirect origin at the tunnel or set the payload URL manually per `github-setup.html`).

## 5. Run server + client
```bash
# terminal A
cd portal/server && npm run dev          # http://localhost:8000

# terminal B  — client in PRODUCTION data mode (calls the real API)
cd portal/client
APP_MODE=production NEXT_PUBLIC_APP_MODE=production NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev
```

## 6. Smoke test (the live exercise)
1. **Login:** open `http://localhost:3000` → **Continue with Google** → sign in with a **seeded/allowlisted** institute email. An un-provisioned email should hit the **Access denied** screen. ✅ auth + allowlist + RBAC.
2. **Onboarding email:** as Admin/LCC, **Create user** → the invitee should receive the onboarding email (check the console-email log if SMTP is off, or the inbox if on). Open it → the tracking pixel flips the invitation to **Opened**.
3. **Connect a repo (ML/DVA/SDSE):** as a mentor, **Connections → Connect with GitHub** → paste a **public** `owner/repo` → authorize. The server creates the webhook, adds `lcc-ai-nst` as a read collaborator, and **syncs the repo into the DB**.
4. **Repository dashboard:** switch domain to that repo's domain → the **My Repository / Team Dashboard** shows live collaborators, commits, PRs, branches, releases, activity (and issues/milestones if present). ✅ repo read service + persistence + scope.
5. **Webhook:** push a commit / open a PR on the connected repo → it appears in the activity feed (via the smee tunnel). ✅ live events.
6. **Scope isolation:** as a mentee of team A, hitting team B's repo dashboard should be **403**. ✅ Phase-4 team isolation.

## 7. Verify rate limit (reader token)
```bash
cd portal/server
node --env-file=.env -e 'fetch("https://api.github.com/rate_limit",{headers:{Authorization:`Bearer ${process.env.GITHUB_READER_TOKEN}`,"User-Agent":"forge"}}).then(r=>r.json()).then(d=>console.log("limit:",d.rate.limit))'
# expect 5000 (60 means the token isn't being used)
```

---

## What to report back
If any step errors, send me the **failing step + server log + response**. The most likely first-run snags: an email not in the allowlist (add it to the seed), the webhook payload URL not pointing at the tunnel, or a private repo (repository mode requires public). I'll fix from there.

## Known follow-ups (intentionally not flipped blind)
- **Teacher/LCC cross-domain rollup** still reads mock — needs a small rollup endpoint; we'll wire it once the single-repo path is verified here.
- **AI org-mode** dashboards' live wiring + the org-mode read-route scope hardening (Phase-4 note) are best verified against the real org during this run.
