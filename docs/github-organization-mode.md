# GitHub — Organization Mode (AI Domain)

How the **AI domain** integrates with GitHub. AI is **GitHub-first**: a teacher-owned **GitHub Organization** is the source of truth, and the whole workflow (issues → PRs → reviews → milestones) lives on GitHub.

Companion: [`github-repository-mode.md`](github-repository-mode.md) (ML/DVA/SDSE) · [`github-setup.html`](github-setup.html) (operator setup) · [`github-flow.html`](github-flow.html) (visual flow).

---

## 1. Model

```
GitHub Organization (newton-school-ai)
├── Teams                 (mentor + students, one per team)
├── Repositories          (one per team)
├── Issues                (the unit of work)
├── Pull Requests         (multiple students → one issue, each a PR)
├── Reviews               (mentor reviews PR + evaluates learning)
└── Milestones            (merged work advances the milestone)
```

The **organization** owns repos and Teams; all repo/team relationships are derived from it. A team = **mentor + students mapped to a repo**.

---

## 2. Workflow (GitHub is the source of truth)

```
Issue opened → student self-assigns → branch → develop →
Pull Request → mentor review (+ learning evaluation) → merge → milestone advances
```

- **Issues are the unit of work** and are **mandatory** in this mode.
- **One issue → many PRs:** multiple students may attempt the same issue, each raising a PR; the mentor merges the best and gives the others feedback.
- **Reviews carry a learning evaluation** (understanding · explanation · technical depth) kept historically — this is the mentoring signal, not just code approval.
- **Milestones** roll up merged work into project progress.

---

## 3. Team synchronization

Forge reads the **org structure** through the GitHub **Teams API**:
- **Teams → mentor + students:** each GitHub Team maps to a Forge team (mentor + roster).
- **Team → repo:** the team's repository is how activity attributes back to the team.
- **Members:** the fine-grained token's **Organization → Members: Read-only** permission is required to read Teams; without it, repos/issues/PRs still read but team grouping won't populate.

New repos added to the org are covered automatically — the **org-level webhook** streams every repo's events.

---

## 4. Integration mechanics

| Piece | Detail |
|---|---|
| Read | one **fine-grained PAT**, resource owner = the org, Read-only on Contents · Metadata · Issues · Pull requests, + Org **Members: Read-only** for Teams |
| Events | **one organization webhook** → server `/api/integrations/github/webhook`, HMAC-verified; covers every current and future repo |
| Attribution | each event resolved by **author login → Forge user** and **repo → team** |
| Env | `GITHUB_ORG` · `GITHUB_API_TOKEN` · `GITHUB_WEBHOOK_SECRET` |

---

## 5. Why AI is different
AI's pedagogy *is* the GitHub workflow: students learn by contributing through issues, branches, PRs, and review. That justifies the org model (Teams, org webhook, mandatory issues). The other domains use GitHub only as collaboration/version-control around a different workflow — so they use **[repository mode](github-repository-mode.md)** instead. Both modes feed the **same dashboard shapes**, so the user experience is consistent across domains.
