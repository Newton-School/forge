# GitHub Integration — Architecture Review (Phase 1)

**Scope:** a deep review of how Forge integrates with GitHub today, the gap that prompted this phase, and exactly which permissions are missing to support **repository-based** integration for non-AI domains. Frontend for both modes is built (mock); **no backend was changed in this phase** — the findings below are analysis to be implemented in Phase 5.

Related: [`github-organization-mode.md`](github-organization-mode.md) · [`github-repository-mode.md`](github-repository-mode.md) · [`github-setup.html`](github-setup.html).

---

## 1. Current implementation

Forge supports **two GitHub integration modes**:

| | **Organization mode** | **Repository mode** |
|---|---|---|
| Domain | AI | ML · DVA · SDSE (+ future) |
| Source of truth | a GitHub **Org** (`newton-school-ai`) | a single **repository** |
| Structure | org → Teams → repos → issues → PRs → milestones | owner + collaborators |
| Reads | fine-grained **PAT** (org-scoped) | per-repo OAuth token / public API |
| Events | **one org webhook** (covers all repos) | **one webhook per repo** (auto-created) |
| Issues | the unit of work (mandatory) | **optional** |

**What exists in code today (`server/src/modules/github/`):**
- `github.api.ts` — org REST client using `GITHUB_API_TOKEN` (fine-grained PAT) against `GITHUB_ORG`.
- `github.read.ts` — org overview, projects, repos, contributors, teams/rosters.
- `github.oauth.ts` + `github.connect.ts` + `github.hooks.ts` — the **per-repo OAuth connect**: the user authorizes the `lcc-ai-nst` OAuth App, the server reads their verified username and **auto-creates a repo webhook**, then **discards the token**.
- Webhook receiver verifies the HMAC and attributes events by **repo URL + author login**.

**Permission model today:**
- **Org mode:** fine-grained PAT, resource owner = org, **Read-only** on Contents · Metadata · Issues · Pull requests, plus **Organization → Members: Read-only** (for Teams). Org webhook secret (`GITHUB_WEBHOOK_SECRET`).
- **Repo mode:** OAuth App scopes requested = **`read:user`**, **`admin:repo_hook`**, **`public_repo`**. The repo webhook subscribes to **push · pull_request · pull_request_review · issues**.

**Schema:** `Team.githubRepoUrl`, `User.githubUsername` / `githubUserId` / `githubConnectedAt`, plus a `GithubActivity` table for ingested webhook events. There are **no** entities yet for collaborators, branches, or releases.

---

## 2. The gap that prompted this phase

The implementation assumed AI's org model was the only "deep" integration. But repository mode needs to surface, for a connected repo: **details · collaborators · contributors · commits · pull requests · branches · releases · activity**. The questions: *do current permissions cover all of that, and what's missing?*

### Data-by-data permission analysis (repository mode)

| Data | GitHub API | Public repo (`public_repo`) | Private repo |
|---|---|---|---|
| Repository details | `GET /repos/{o}/{r}` | ✅ | needs `repo` / App |
| Contributors | `GET /repos/{o}/{r}/contributors` | ✅ | needs `repo` / App |
| Commits | `GET /repos/{o}/{r}/commits` | ✅ | needs `repo` / App |
| Pull requests | `GET /repos/{o}/{r}/pulls` | ✅ | needs `repo` / App |
| Branches | `GET /repos/{o}/{r}/branches` | ✅ | needs `repo` / App |
| Releases | `GET /repos/{o}/{r}/releases` | ✅ | needs `repo` / App |
| Repository activity | `GET /repos/{o}/{r}/events` | ✅ | needs `repo` / App |
| **Collaborators** | `GET /repos/{o}/{r}/collaborators` | ⚠️ **requires push access** — not granted by a read-only public token | needs `repo` + push / App `Members:read` |

---

## 3. Gaps & risks

1. **Private repos aren't covered.** `public_repo` only reads **public** repositories. SDSE (and any private team repo) returns 404/403 for every endpoint above. → Needs **`repo`** (full) **or** a **GitHub App** with fine-grained read.
2. **Collaborators need elevated access.** The collaborators endpoint requires **push** access even on public repos. A read-only public token can't list them. → Needs the **machine account (`lcc-ai-nst`) added as a collaborator**, or a **GitHub App** with `Members`/`Administration: read`.
3. **The OAuth token is discarded** after webhook creation (by design, for safety). So there is **no durable token** for on-demand reads of private repos — reads currently rely on the repo being public.
4. **Webhook event coverage is incomplete.** The auto-created hook subscribes to push/PR/review/issues only. **Branch create/delete and releases are not delivered** (`create`, `delete`, `release` events), nor collaborator changes (`member`). Live branch/release/collaborator updates won't arrive.
5. **Rate limits & pagination.** Per-repo polling across many domains needs caching + Link-header pagination (the org client already paginates; a repo client must too).

---

## 4. Required changes (for Phase 5 — not done now)

**Pick one durable-read strategy:**

- **Option A — Public + machine collaborator (lightweight).** Require non-AI repos to be **public**, and have the connect flow **add `lcc-ai-nst` as a read collaborator**. That yields durable reads **and** collaborator listing with no stored user token. Extend the created webhook's events to **push · pull_request · pull_request_review · issues · create · delete · release · member**. *Good for a pilot; fails for repos that must stay private.*

- **Option B — GitHub App per repo (robust, recommended for production).** A single GitHub App (owned by `lcc-ai-nst`), **installed per repo**, with fine-grained **read** on **Contents · Metadata · Pull requests · Issues · Administration (or Members)** and event subscriptions for all of the above. Installation tokens give **durable private-repo reads**; the App's central webhook removes per-repo hook creation. *Reintroduces App machinery (private key, JWT, installation tokens) — the cost of supporting private repos cleanly.*

**OAuth scope change (if staying on Option A for reads):** add nothing for public; for private fallback, `public_repo` → **`repo`**. Either way, add the missing **webhook events**.

**Schema (Phase 3):** add repo-scoped read models — `RepoCollaborator`, `RepoBranch`, `RepoRelease`, and a `Repository` row carrying owner/visibility/defaultBranch — so the repo dashboards read from Forge rather than hitting GitHub on every request.

---

## 5. Recommendation
Adopt the **two-mode architecture** explicitly. For repository mode, ship **Option A** for the public-repo pilot (smallest change: collaborator add + extra webhook events), and plan **Option B (GitHub App)** for production so private team repos and collaborator/branch/release data are fully supported.

### Decision (locked) & Phase-2 status
- **All team repositories are public** → **Option A** is the chosen strategy. No GitHub App / `repo` scope / private machinery is needed.
- **Implemented in Phase 2 (backend read service):**
  - Repository-mode **read service** (`repo.api.ts` + `repo.read.ts`) returning the dashboard shapes (details · collaborators · contributors · commits · PRs · branches · releases · activity), read-through, public API (optional `GITHUB_READER_TOKEN` for higher limits).
  - Routes under `/api/integrations/github/repo/:owner/:repo/*` and team-scoped `/teams/:teamId/repo/dashboard`.
  - The connect flow now **adds the machine reader (`GITHUB_READER_LOGIN`, default `lcc-ai-nst`) as a read collaborator** and the auto-created webhook subscribes to the full event set **push · pull_request · pull_request_review · issues · create · delete · release · member**.
- **Implemented in Phase 3 (persistence):** `Repository` · `RepoCollaborator` · `RepoBranch` · `RepoRelease` models; a sync service (`repo.sync.ts`) that captures repo meta + collaborators (with the **owner's token at connect** — this **closes the collaborators gap**) + branches + releases into the DB; a DB-backed team dashboard read (`repoRead.teamDashboard`) and a re-sync route. Apply with `prisma db push` when Postgres is up.
- **Still pending (later phases):** wiring the frontend dashboards to these endpoints, and webhook-driven incremental updates.
