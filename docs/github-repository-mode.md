# GitHub — Repository Mode (ML · DVA · SDSE)

How repository-based GitHub integration works for the non-AI domains. These domains have **no GitHub organization** — a **Team Lead or Mentor owns one repository** and students are **collaborators**. The **repository is the source of truth**, and **Issues are optional**.

Companion: [`github-organization-mode.md`](github-organization-mode.md) (the AI org model) · [`github-integration-review.md`](github-integration-review.md) (permission gaps).

---

## 1. Model

```
ML / DVA / SDSE Domain
└── Team Repository (owned by a Team Lead OR a Mentor)
    ├── Owner            (admin)         — Team Lead (ML) or Mentor (DVA, SDSE)
    ├── Mentor / Lead    (write)
    ├── Student A        (write)
    ├── Student B        (write)
    └── Student C        (read/write)
```

There is **no org, no GitHub Teams, no org-level permissions**. Everything is derived from the **single connected repository** and its **collaborators**.

| Concept | Organization mode (AI) | Repository mode (ML/DVA/SDSE) |
|---|---|---|
| Source of truth | the org | the repository |
| Grouping | GitHub Teams | repository collaborators |
| Ownership | org owns repos | a person owns the repo |
| Issues | the unit of work (required) | **optional** — work also flows via tasks/deliverables/milestones |
| Setup | org webhook + read token | per-repo webhook + token (one click) |

---

## 2. Supported features (what the dashboards show)

For any connected repo, regardless of domain:

- **Repository details** — name, owner, visibility, default branch, topics, description.
- **Collaborators** — owner / maintainer / collaborator, with permission (admin/write/read) and portal role (Team Lead / Mentor / Mentee).
- **Contributors** — per-person commits, PRs, code changes (+/−), last active.
- **Commits** — history and per-author distribution.
- **Pull requests** — open / merged / closed, reviewers, review state, diff size.
- **Branches** — default + feature branches, protection, ahead/behind.
- **Releases** — tags, notes, author, date.
- **Repository activity** — a unified feed of commits, PR events, and releases.
- **Milestones** — repository milestones (if used) alongside portal milestones.
- **Issues** — shown **only if the repository uses them**; otherwise an empty state points to the drive (tasks/deliverables/milestones).

### Role experience
- **Mentee** — My Repository · Issues *(if used)* · My Pull Requests · Contribution Analytics · Milestones.
- **Mentor** — Team Dashboard · Repository (health · contributors · branches · releases) · Issues *(if used)* · Pull Requests (incl. pending review) · Student Performance.
- **Teacher** — repository analytics across the domain's repos (contributors, PR/commit/participation metrics) — **no org required**.
- **LCC / Admin** — repository-based domain overview.

---

## 3. Setup flow (one click)

1. A **mentor or team lead** opens **Connections → GitHub**, clicks **Connect with GitHub**, and pastes the team repo URL (`owner/repo`).
2. The server (via the `lcc-ai-nst` OAuth App) verifies their username and **auto-creates the repo webhook** (payload URL + shared secret + events) — no GitHub settings to touch.
3. Students click **Connect with GitHub** once to link their username (so commits/PRs attribute to them).
4. The dashboards above fill in. **Keep the repo public** (or grant the Forge reader access — see permissions) so all data is readable.

---

## 4. Permissions

| Need | Mechanism |
|---|---|
| Verify usernames | OAuth `read:user` |
| Create the repo webhook | OAuth `admin:repo_hook` (owner/mentor has admin) |
| Read public repo data | `public_repo` (or unauthenticated public API) |
| Read **private** repo data | `repo` scope **or** a GitHub App (Contents/Metadata/PR/Issues read) |
| List **collaborators** | push access — add `lcc-ai-nst` as a collaborator, **or** App `Members:read` |
| Live branches/releases/collaborators | add webhook events `create · delete · release · member` |

**Decision (locked):** all team repos are **public**, so the private-repo rows don't apply. On connect, Forge adds its machine reader (`lcc-ai-nst`) as a **read collaborator** (covers durable reads + collaborator listing) and the webhook subscribes to the full event set (**push · pull_request · pull_request_review · issues · create · delete · release · member**). This is **Option A** in [`github-integration-review.md`](github-integration-review.md) §4 — and the backend read service for it is implemented (Phase 2).

---

## 5. Why issues are optional here
Non-AI domains are **not GitHub-first**. GitHub provides collaboration, version control, deliverables, and contribution tracking — but the *workflow* runs through mentor tasks, deliverables, milestones, progress updates, research, and documentation. So the dashboards **surface issues if they exist** but never force the issue → PR loop that defines the AI org model.
