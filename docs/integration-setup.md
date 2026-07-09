# Integration Setup & Credentials Guide

This guide documents the credential provisioning and configuration steps for **every external integration** used by the platform.

## Architecture recap

- **`portal/client`** — Next.js front end. It renders the UI and talks **only** to our own server (`/api`). It never calls Google, GitHub, Discord, or Groq directly.
- **`portal/server`** — Node.js + Express back end. **All** integrations are invoked server-side. Every OAuth callback and every webhook points at the **server**, not the client.
- **Secrets**
  - **Production:** every secret lives in **AWS Secrets Manager** under the namespace `/forge/<env>/*` and is injected into the ECS task at runtime (see §6). Nothing is baked into images.
  - **Local:** a git-ignored `server/.env` file (see §7). Never commit it.
- **Public base URL (example):** `https://app.<your-domain>` (Cloudflare → ALB → ECS).
  - Server API base: `https://app.<your-domain>/api`
  - Local client: `http://localhost:3000`
  - Local server: `http://localhost:8000`

Throughout this doc, replace `<your-domain>` with your real domain and `<env>` with the environment name (`dev`, `staging`, `prod`).

> **Key principle:** Because the server owns every integration, all redirect URIs and webhook URLs use the **server** origin (`https://app.<your-domain>/api/...`) in production and `http://localhost:8000/api/...` locally — *never* the client origin (`:3000`).

---

## 1. Google OAuth (login)

Authentication is **Google OAuth (OIDC) only**. There is **no email/password** path. A user may sign in **only if both** of the following are true:

1. Their Google account's **hosted domain** (`hd` claim) equals `ALLOWED_HOSTED_DOMAIN` (e.g. `rishihood.edu.in`), **and**
2. Their email **already exists** in the `users` table (the allowlist).

Any other email is rejected at the callback before a session is created.

### 1.1 Create / select a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Create a project (e.g. `forge-prod`) or select an existing one.

### 1.2 Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen.**
2. **User type:**
   - If you control a Google Workspace org for `rishihood.edu.in`, choose **Internal**. This implicitly restricts logins to that Workspace domain — the strongest gate.
   - Otherwise choose **External**, and we enforce the domain restriction in code via the `hd` claim + allowlist (see 1.5).
3. Fill in app name, support email, and developer contact.
4. **Scopes:** add the OIDC basics only — `openid`, `email`, `profile`. No other scopes are needed for login.
5. If **External**, publish the app (or add test users during development).

### 1.3 Create the OAuth Client ID

1. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
2. **Application type:** **Web application.**
3. **Authorized redirect URIs** — point at the **server** callback:

   ```
   https://app.<your-domain>/api/auth/google/callback
   http://localhost:8000/api/auth/google/callback
   ```

4. Create, then copy the **Client ID** and **Client secret**.

### 1.4 Environment variables

```bash
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=https://app.<your-domain>/api/auth/google/callback
ALLOWED_HOSTED_DOMAIN=rishihood.edu.in
SESSION_SECRET=<long-random-string>   # signs the session cookie
```

`SESSION_SECRET` should be a long, random, high-entropy value (e.g. `openssl rand -hex 32`). Rotating it invalidates all existing sessions.

### 1.5 How the login gate works

After Google redirects back to `/api/auth/google/callback`, the server:

1. Exchanges the code for tokens and validates the **ID token** (signature, `aud`, `iss`, expiry).
2. **Hosted-domain check:** reads the `hd` claim. If `hd !== ALLOWED_HOSTED_DOMAIN`, reject. (Do **not** rely on the email suffix alone — always check the verified `hd` claim, and require `email_verified === true`.)
3. **Allowlist check:** looks up the email in the `users` table. If it is **not present**, reject — even if the domain matches. We never auto-provision unknown users.
4. Only when both checks pass does the server create a session (cookie signed with `SESSION_SECRET`).

Unknown emails therefore fail at step 3 and receive an access-denied response; no account is created and no session is issued.

---

## 2. GitHub

**Recommendation: use a GitHub App**, not an OAuth App, for the core integration. A GitHub App is installed at the **org level**, offers **fine-grained permissions**, has **higher rate limits** (per-installation), and authenticates as the app/installation rather than as a single user. An OAuth App is still useful as an *optional* path for individual users to link their personal repos (see 2.5).

### 2.1 Create the GitHub App

1. **Org → Settings → Developer settings → GitHub Apps → New GitHub App.**
2. **Homepage URL:** `https://app.<your-domain>`.
3. **Webhook → Active:** on.
   - **Webhook URL:** `https://app.<your-domain>/api/webhooks/github`
   - **Webhook secret:** generate a strong random secret; this is used for **HMAC SHA-256** signature verification of the `X-Hub-Signature-256` header.

### 2.2 Permissions (least privilege, read-only)

Repository permissions:

| Permission        | Access |
| ----------------- | ------ |
| Contents          | Read   |
| Issues            | Read   |
| Pull requests     | Read   |
| Metadata          | Read   |

Organization permissions:

| Permission        | Access |
| ----------------- | ------ |
| Members           | Read   |

### 2.3 Subscribe to webhook events

- `push`
- `pull_request`
- `pull_request_review`
- `issues`
- `milestone`

### 2.4 Credentials & installation

1. Note the **App ID** (shown on the app's settings page).
2. **Generate a private key** (`.pem`) — downloaded once; store it as a secret.
3. **Install** the app on the org (all repos, or selected repos).
4. After install, read the **Installation ID** from the installation URL or via the API (`GET /app/installations`).

The server uses App ID + private key to mint a JWT, then exchanges it for an **installation access token** scoped to the installation.

### 2.5 Optional OAuth App (user repo linking)

For letting individual users link their own repos, create a separate **OAuth App**:

- **Authorization callback URL:** `https://app.<your-domain>/api/integrations/github/callback`
- Copy its **Client ID / Client secret**.

### 2.6 Environment variables

```bash
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_WEBHOOK_SECRET=<random-webhook-secret>
# Optional OAuth App (user repo linking):
GITHUB_CLIENT_ID=Iv1.xxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
```

> The private key is multi-line PEM. Store it with literal `\n` escapes (as above) or as a Secrets Manager value and convert newlines at load time. Never commit the `.pem`.

---

## 3. Discord

### 3.1 Create the Application & Bot

1. Go to <https://discord.com/developers/applications> → **New Application**.
2. Copy the **Application (Client) ID** and, under **OAuth2**, the **Client Secret**.
3. **Bot** tab → **Add Bot** → copy the **Bot Token**.
4. **Privileged Gateway Intents:**
   - Enable **Server Members Intent** (needed to read member info).
   - **Leave Message Content Intent off** unless strictly required — minimize it.

### 3.2 OAuth2 (user identity linking)

- **OAuth2 → Redirects:** add `https://app.<your-domain>/api/integrations/discord/callback`
- **Scopes:** `identify` (required), optionally `guilds` (to list the user's servers). Request nothing more.

### 3.3 Interactions endpoint (webhook)

- **General Information / Interactions Endpoint URL:** `https://app.<your-domain>/api/webhooks/discord`
- Discord requires **Ed25519 signature verification**: every interaction request carries `X-Signature-Ed25519` and `X-Signature-Timestamp`, verified against the application's **Public Key**. Discord will not save the URL unless the endpoint correctly responds to its verification PING.

### 3.4 Bot install (least-privilege guild permissions)

Generate an install URL (**OAuth2 → URL Generator**) with scopes `bot` (+ `applications.commands` if using slash commands) and only these guild permissions:

- **View Channels**
- **Read Message History**
- **Send Messages** (for announcements)

Install into the target guild and record the **Guild ID** (enable Developer Mode → right-click the server → Copy ID).

### 3.5 Environment variables

```bash
DISCORD_CLIENT_ID=xxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxx
DISCORD_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxx   # used for Ed25519 verification
DISCORD_GUILD_ID=123456789012345678
```

---

## 4. Google Calendar API

### 4.1 Enable the API

1. In the **same Google Cloud project** (§1), go to **APIs & Services → Library**.
2. Enable **Google Calendar API**.

### 4.2 Choose an auth model

**Option A — OAuth (per-organizer).** Each organizer grants access to their own calendar via OAuth consent. Best when events live on individual users' calendars.

- **Scope:** `https://www.googleapis.com/auth/calendar.events`
- **Redirect URI:** `https://app.<your-domain>/api/integrations/calendar/callback`
- Reuse or create a Web-application OAuth client; store **Client ID / Secret**. Persist each user's **refresh token** server-side.

**Option B — Service account (shared calendar).** A single service account writes to one shared calendar (e.g. a team / "shared drive" calendar). Best for a centrally-owned calendar; no per-user consent.

1. **APIs & Services → Credentials → Create credentials → Service account.**
2. Create a **JSON key** for it (`GOOGLE_SA_KEY`).
3. **Share the target calendar** with the service account's email and grant "Make changes to events."
4. If using Workspace **domain-wide delegation** to impersonate organizers, authorize the service account's client ID for the `calendar.events` scope in the Admin console.

Record the calendar's **Calendar ID** (Calendar settings → Integrate calendar → Calendar ID) as `GOOGLE_CALENDAR_ID`.

### 4.3 Environment variables

```bash
# Option A (OAuth per-organizer)
GOOGLE_CALENDAR_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
GOOGLE_CALENDAR_ID=primary_or_calendar_id@group.calendar.google.com

# Option B (service account alternative)
GOOGLE_SA_KEY='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com",...}'
```

> Keep these calendar OAuth credentials separate from the login OAuth client (§1) so scope changes to one don't affect the other.

---

## 5. Groq

The platform uses Groq for LLM inference (e.g. the `llama-3.1-8b-instant` model). **Server-side only** — the API key never reaches the client.

### 5.1 Get the API key

1. Sign in at <https://console.groq.com/>.
2. **API Keys → Create API Key.** Copy it once (it is not shown again).
3. Pick a model from the Groq model list (default below).

### 5.2 Environment variables

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
```

### 5.3 Operational notes

- **Server-side only:** all Groq calls originate from the Express server. The browser never sees `GROQ_API_KEY`.
- **Capped tokens:** set a `max_tokens` ceiling on every request to bound cost and latency.
- **Rate-limited:** apply server-side rate limiting / queuing and handle `429` responses with backoff. Degrade gracefully if Groq is unavailable (see Common Patterns).

---

## 6. Putting secrets in AWS Secrets Manager

In production, **no** secret lives in the image or in plain env vars in the task definition. Each variable maps to a secret under `/forge/<env>/...`.

### 6.1 Secret mapping

| Env var                          | Secrets Manager name                          |
| -------------------------------- | --------------------------------------------- |
| `GOOGLE_OAUTH_CLIENT_ID`         | `/forge/<env>/google_oauth_client_id`         |
| `GOOGLE_OAUTH_CLIENT_SECRET`     | `/forge/<env>/google_oauth_client_secret`     |
| `SESSION_SECRET`                 | `/forge/<env>/session_secret`                 |
| `GITHUB_APP_ID`                  | `/forge/<env>/github_app_id`                  |
| `GITHUB_APP_PRIVATE_KEY`         | `/forge/<env>/github_app_private_key`         |
| `GITHUB_APP_INSTALLATION_ID`     | `/forge/<env>/github_app_installation_id`     |
| `GITHUB_WEBHOOK_SECRET`          | `/forge/<env>/github_webhook_secret`          |
| `GITHUB_CLIENT_ID`               | `/forge/<env>/github_client_id`               |
| `GITHUB_CLIENT_SECRET`           | `/forge/<env>/github_client_secret`           |
| `DISCORD_CLIENT_SECRET`          | `/forge/<env>/discord_client_secret`          |
| `DISCORD_BOT_TOKEN`              | `/forge/<env>/discord_bot_token`              |
| `DISCORD_PUBLIC_KEY`             | `/forge/<env>/discord_public_key`             |
| `GOOGLE_CALENDAR_CLIENT_SECRET`  | `/forge/<env>/google_calendar_client_secret`  |
| `GOOGLE_SA_KEY`                  | `/forge/<env>/google_sa_key`                  |
| `GROQ_API_KEY`                   | `/forge/<env>/groq_api_key`                   |
| `DATABASE_URL` / `DIRECT_URL`    | `/forge/<env>/database_url` / `direct_url`    |
| `REDIS_URL`                      | `/forge/<env>/redis_url`                       |

(Non-secret values like `ALLOWED_HOSTED_DOMAIN`, `GROQ_MODEL`, `APP_BASE_URL`, `NODE_ENV`, and redirect URIs can be plain task-definition env vars.)

### 6.2 Create a secret

```bash
aws secretsmanager create-secret \
  --name /forge/prod/groq_api_key \
  --secret-string 'gsk_xxxxxxxxxxxxxxxxxxxx'
```

### 6.3 Inject into the ECS task definition

Reference each secret by ARN in the container's `secrets` block; ECS resolves it into the environment at task start:

```json
{
  "containerDefinitions": [
    {
      "name": "portal-server",
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "ALLOWED_HOSTED_DOMAIN", "value": "rishihood.edu.in" },
        { "name": "APP_BASE_URL", "value": "https://app.<your-domain>" }
      ],
      "secrets": [
        { "name": "GROQ_API_KEY", "valueFrom": "arn:aws:secretsmanager:<region>:<acct>:secret:/forge/prod/groq_api_key" },
        { "name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:<region>:<acct>:secret:/forge/prod/session_secret" }
      ]
    }
  ]
}
```

The ECS **task execution role** must have `secretsmanager:GetSecretValue` (and `kms:Decrypt` if a CMK is used) for the `/forge/<env>/*` secrets.

### 6.4 Hygiene & rotation

- **Never commit secrets.** `server/.env` is git-ignored; commit only `server/.env.example`.
- Use a **separate namespace per environment** (`/forge/dev/*`, `/forge/staging/*`, `/forge/prod/*`).
- **Rotate** credentials periodically and immediately on suspected exposure: GitHub App private key, Discord bot token, Groq key, OAuth secrets, and `SESSION_SECRET`. After rotating in Secrets Manager, redeploy/restart the ECS service so tasks pick up the new value.

---

## 7. `server/.env.example`

Commit this template (no real values). Copy to `server/.env` locally and fill in.

```bash
# ---- Runtime ----
NODE_ENV=development
APP_BASE_URL=http://localhost:8000

# ---- Datastores ----
DATABASE_URL=postgresql://user:pass@localhost:5432/forge
DIRECT_URL=postgresql://user:pass@localhost:5432/forge
REDIS_URL=redis://localhost:6379

# ---- Google OAuth (login) ----
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
ALLOWED_HOSTED_DOMAIN=rishihood.edu.in
SESSION_SECRET=

# ---- GitHub (App) ----
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_INSTALLATION_ID=
GITHUB_WEBHOOK_SECRET=
# Optional GitHub OAuth App (user repo linking)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ---- Discord ----
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_PUBLIC_KEY=
DISCORD_GUILD_ID=

# ---- Google Calendar ----
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_ID=
# Service-account alternative (JSON string)
GOOGLE_SA_KEY=

# ---- Groq ----
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

---

## Common patterns

These apply to **every** integration:

- **Verify all webhook signatures.** Reject any unsigned or mis-signed payload before processing.
  - GitHub: HMAC SHA-256 over the raw body using `GITHUB_WEBHOOK_SECRET`, compared to `X-Hub-Signature-256` (constant-time compare).
  - Discord: Ed25519 over `timestamp + body` using `DISCORD_PUBLIC_KEY`.
  - Always verify against the **raw request body**, not the parsed JSON.
- **Least-privilege scopes & permissions.** Request only what's listed here (read-only GitHub perms, `identify` for Discord, `calendar.events` for Calendar, `openid email profile` for login). Add scopes deliberately, never "just in case."
- **Idempotent syncs.** Webhooks can be redelivered and may arrive out of order. Key handlers by stable IDs (delivery ID, event ID, resource ID) and upsert so reprocessing the same event is a no-op.
- **Graceful degradation.** If an upstream (GitHub, Discord, Calendar, Groq) is down or rate-limited, fail the affected feature softly — surface a clear status, retry with backoff, and keep the rest of the platform working. The login path and core app must not depend on any single optional integration.
