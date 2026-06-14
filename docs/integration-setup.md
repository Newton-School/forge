# Integration Setup Guide — GitHub · Discord · Google Calendar

> These integrations are **designed in Phase 1** (UI + architecture) and **wired live in Phase 2/3**. Each follows the same pattern: store credentials in env (encrypted on Vercel) → connect per-team → sync via webhooks + on-demand pulls → normalize into `*_activity` tables → surface in dashboards → degrade gracefully when unavailable.

---

## 1. GitHub

Tracks: commits, pull requests, issues, reviews, branch activity, repository contribution, milestone completion. Powers the Mentor's team-delivery board, GitHub analytics (25% of top-team rubric), and inactivity flags.

### 1.1 Create a GitHub OAuth App (for user identity / repo connection)
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Application name:** `PBDMP`.
3. **Homepage URL:** `https://<your-app>.vercel.app` (or `http://localhost:3000` for dev).
4. **Authorization callback URL:** `https://<your-app>.vercel.app/api/github/callback` (and a localhost variant for dev).
5. Register → copy **Client ID**; generate a **Client Secret**.
6. Put into env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

### 1.2 (Recommended) Create a GitHub App (for org/repo activity at scale)
A GitHub **App** (vs OAuth App) gives fine-grained, per-repo permissions and higher rate limits — better for syncing many team repos.
1. **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. **Webhook URL:** `https://<your-app>.vercel.app/api/webhooks/github`; set a **Webhook secret** → `GITHUB_WEBHOOK_SECRET`.
3. **Repository permissions:** Contents (Read), Issues (Read), Pull requests (Read), Metadata (Read), Commit statuses (Read).
4. **Organization permissions:** Members (Read) — to map usernames to platform users.
5. **Subscribe to events:** `push`, `pull_request`, `pull_request_review`, `issues`, `milestone`.
6. Generate a **private key** (store securely) and note the **App ID** / **Installation ID**.
7. Install the App on the org and select the team repositories.

### 1.3 Organization & repository permissions checklist
- Org admin installs the App and grants access to each team's repo.
- Each `Team.githubRepoUrl` is mapped in Admin → Integrations.
- Platform users set their `githubUsername` (or it's mapped via org membership) so commits/PRs attribute correctly.

### 1.4 Webhook setup
- Endpoint: `POST /api/webhooks/github` (Route Handler).
- Verify the `X-Hub-Signature-256` HMAC against `GITHUB_WEBHOOK_SECRET`; reject on mismatch.
- Accept fast (return 2xx), process the payload, upsert into `GithubActivity` (idempotent on event id).
- A nightly on-demand pull reconciles anything webhooks missed.

### 1.5 Env
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
# GitHub App (optional, recommended):
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_INSTALLATION_ID=
```

---

## 2. Discord

Tracks: participation (messages/reactions), team channels, announcements, onboarding (who joined / submitted username). Powers onboarding tracker (LCC), engagement analytics (20% of rubric), inactivity flags, announcement fan-out.

### 2.1 Create a Discord Application + Bot
1. **https://discord.com/developers/applications → New Application** → name `PBDMP`.
2. Copy **Application (Client) ID** and **Public Key** → `DISCORD_CLIENT_ID`, `DISCORD_PUBLIC_KEY`.
3. **OAuth2 → Reset Secret** → copy **Client Secret** → `DISCORD_CLIENT_SECRET`.
4. **Bot → Add Bot** → **Reset Token** → copy → `DISCORD_BOT_TOKEN` (treat as highly sensitive).
5. Under **Bot**, enable **Privileged Gateway Intents** as needed: *Server Members Intent* (onboarding/member mapping), *Message Content Intent* (only if reading message text — minimize for privacy; prefer counts/metadata).

### 2.2 OAuth2 setup (link a user's Discord identity)
1. **OAuth2 → Redirects:** add `https://<your-app>.vercel.app/api/discord/callback` (+ localhost).
2. Scopes for user linking: `identify` (+ `guilds` if you verify membership).
3. Used so a Mentee's `discordUsername` maps to a real account during onboarding.

### 2.3 Guild (server) permissions / invite the bot
1. **OAuth2 → URL Generator** → scopes: `bot`, `applications.commands`.
2. **Bot Permissions:** View Channels, Read Message History, Send Messages (for announcements), Embed Links. Keep to the minimum.
3. Open the generated URL → install the bot into the drive's Discord **guild**.
4. Map `Team.discordChannelId` per team in Admin → Integrations; set `DISCORD_GUILD_ID`.

### 2.4 Activity ingestion (serverless-friendly)
- A persistent gateway connection is **not** free-tier friendly. Prefer:
  - **Interactions webhook** (`POST /api/webhooks/discord`, verify Ed25519 signature with `DISCORD_PUBLIC_KEY`) for slash-command / interaction events.
  - **On-demand REST pulls** (channel message counts, member list) triggered when LCC opens the onboarding/engagement view or via the daily cron.
- Outbound announcements use the REST API with `DISCORD_BOT_TOKEN`.

### 2.5 Env
```
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_PUBLIC_KEY=
DISCORD_GUILD_ID=
```

---

## 3. Google Calendar

Syncs: mentor meetings, review meetings, deadlines, milestones, events (hackathons, peer interviews, presentations).

### 3.1 Google Cloud project + Calendar API
1. **https://console.cloud.google.com** → create a project `PBDMP`.
2. **APIs & Services → Library → Google Calendar API → Enable**.

### 3.2 OAuth consent screen
1. **APIs & Services → OAuth consent screen** → User type **External** (or Internal if a Workspace org).
2. App name, support email, developer contact.
3. **Scopes:** `.../auth/calendar.events` (manage events) — or `calendar.readonly` if you only read.
4. Add test users while in "Testing"; submit for verification before production use.

### 3.3 OAuth client credentials
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type **Web application**.
3. **Authorized redirect URIs:** `https://<your-app>.vercel.app/api/calendar/callback` (+ localhost).
4. Copy **Client ID** / **Client Secret** → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5. The target calendar's id → `GOOGLE_CALENDAR_ID` (e.g., `primary` or a shared drive calendar).

> Alternative for a single shared drive calendar: a **service account** with domain-wide delegation. OAuth (above) is simpler for per-organizer calendars.

### 3.4 Sync model
- Platform **creates** events (review meetings, deadlines, milestone due dates) and **reads** attendee responses → `CalendarEvent`.
- On-demand sync on view + optional daily cron; store `externalEventId` for idempotent upserts.

### 3.5 Env
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_ID=
```

---

## 4. Common patterns
- **Credential storage:** env vars only; encrypted at rest on Vercel; per-team tokens (if any) encrypted in `IntegrationAccount.credentialsRef`.
- **Idempotency:** all syncs upsert on the provider's stable id.
- **Graceful degradation:** if a provider is down, dashboards show a "last synced" timestamp and never block core flows.
- **Security:** verify every webhook signature; request the **least** scopes/intents; never expose tokens to the client bundle.
