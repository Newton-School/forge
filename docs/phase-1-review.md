# Phase 1 — Review & Decisions

This phase delivered a **presentation-first** frontend (mock data only) so the platform's workflows can be reviewed and approved **before** any backend engineering. Nothing in `server/` was changed. This document records the assumptions, decisions, and open items for your review.

Deliverables: the repository-mode dashboards (ML/DVA/SDSE) + the three architecture docs ([review](github-integration-review.md) · [repo mode](github-repository-mode.md) · [org mode](github-organization-mode.md)) + the [demo guide](phase-1-demo-guide.html).

---

## 1. What was built
- **Two GitHub modes, one consistent dashboard:** AI keeps **organization mode** (unchanged); ML/DVA/SDSE get **repository mode** (owner + collaborators, no org).
- **Repo-mode mock data** (`client/lib/mock/github-repo.ts`) — one connected repo per non-AI domain with collaborators, contributors, commits, PRs, branches, releases, activity, milestones, and (for ML) issues. All analytics are **derived** so nothing contradicts.
- **Repo-mode dashboards** for Mentee, Mentor, Teacher, LCC, Admin — rendered by branching the existing `/{role}/github/**` routes on the active domain.
- **Nav** — a repository-mode GitHub section is injected for non-AI domains (the sidebar was previously hard-gated to AI).
- **Presentation mode** — switch **Role** (incl. Team Lead) × **Domain** (AI/ML/DVA/SDSE) to see every experience instantly.

## 2. Assumptions made
- Non-AI team repos are **public** in the demo (so all data reads without elevated permissions). Private repos are a documented Phase-5 decision (see review doc).
- The mock seeds **mixed ownership** to show both real patterns: **ML repo is Team-Lead-owned**, **DVA and SDSE are Mentor-owned**.
- **ML uses Issues** (to show the optional-issues path present); **DVA and SDSE don't** (to show the "issues optional" empty state pointing to the drive).
- The repo-mode views key off the **active domain's demo repo**, so domain switching instantly changes the repository experience regardless of which dev user is selected.

## 3. UI decisions
- Reused the existing dashboard primitives (StatCard, SectionCard, Table, Badge, BarChart, Avatar, EmptyState) and the Jira/Linear design language — white surfaces, 1px borders, one indigo accent.
- Repo dashboards lead with **Repository info → stats → collaborators → activity → branches/releases**, and contribution analytics as tables + a commit-distribution bar chart.
- The sidebar domain chip now reads **"GitHub-driven org"** (AI) vs **"Repository-connected"** (others).

## 4. Workflow decisions
- **Issues are never forced** in repository mode. They appear only when the connected repo uses them; otherwise the Issues page explains that work is tracked through tasks/deliverables/milestones in the drive.
- Mentor's **Pull Requests** view highlights PRs **awaiting review**; Mentee's **My Pull Requests** scopes to their own PRs.
- Teacher sees **repository analytics across the domain** plus a cross-domain rollup of every repository-based domain — **no GitHub org required**.

## 5. Domain-specific behavior (summary)
| Domain | Mode | Owner | Issues | Visibility |
|---|---|---|---|---|
| AI | Organization | org / teacher | required | org repos |
| ML | Repository | **Team Lead** | yes | public |
| DVA | Repository | **Mentor** | no | public |
| SDSE | Repository | **Mentor** | no | public |

## 6. GitHub integration approach
The frontend renders the exact data shapes the real API will provide, so Phase 5 backend work is "fill the same shapes from GitHub." The **permission gaps** (private repos, collaborators, webhook event coverage) and the two recommended strategies are documented in [`github-integration-review.md`](github-integration-review.md).

## 7. Open items requiring your review
1. **Team Lead** — ✅ **Decided: alias for Mentor** (5-role model; "Team Lead" opens the Mentor view). No separate 6th role.
2. **Repository visibility** — ✅ **Decided: all team repos are public** → lightweight **Option A** (machine reader added as a read collaborator + full webhook event set), implemented in the Phase-2 backend read service. No GitHub App / private path.
3. **Issues-optional behavior** — confirm the "issues hidden unless used" rule reads well for non-AI domains.
4. **Repo ownership** — confirm the mixed Team-Lead/Mentor ownership matches how teams actually run.
5. **Cross-domain teacher/LCC view** — confirm the rollup of all repository-based domains is the right altitude.

## 8. Approval gate
Per the agreed plan, work **stops here**. Backend, database/Prisma, authentication, GitHub/Discord/Calendar/Email sync, and ECS/Docker infrastructure are **not** started until this frontend + these documents are reviewed and approved.
