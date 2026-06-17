# Architecture Review — Phase 1 (AI Domain Frontend)

**Status:** for review before Phase 2 · **Scope:** frontend + mock data only · **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4.

## Context
The AI Domain is a **teacher-owned GitHub Organization**, not a task-tracker. Teams own repos; **issues are the unit of work**; **multiple students attempt one issue** (each raising a PR); the **mentor reviews PRs and evaluates learning** (understanding / explanation / technical depth) before merging — which advances milestones. **GitHub is the source of truth; the portal is the visibility, analytics, mentoring, evaluation and governance layer on top.** Phase 1 validates that experience with mock data before any backend is built.

Forge is multi-domain (AI / ML / SDSE). Phase 1 makes **AI fully GitHub-driven** while **ML/SDSE reuse the existing "drive" screens** (updates / tasks / deliverables / reviews) — proving a **domain-aware** architecture without a rewrite.

---

## 1. Frontend architecture
- **App Router, Server Components by default.** Screens are server components that read synchronous fixtures; `"use client"` only for interactivity (switchers, self-assign, review form). `params`/`cookies()` are awaited (Next 16).
- **Data-access seam (DIP).** Every page imports from `@/lib/api` only — never the mock modules directly. `lib/api` re-exports the fixtures today and flips to `fetch` against the Express API in Phase 2 with no call-site changes. New AI data lives in `lib/mock/github.ts`, surfaced through the same seam.
- **Design system reuse.** GitHub screens compose existing primitives (`PageHeader`, `StatCard`/`StatGrid`, `SectionCard`, `Table`, `Badge`, `Progress`, `BarChart`) — one Jira/Linear design language across drive and GitHub views.
- **UX states.** Lists use an `EmptyState`; analytics are derived (never contradictory); everything is keyboard-navigable.

## 2. Domain-aware architecture
- **Two presentation dimensions:** role (`forge_role`) × domain (`forge_domain`), both dev-only preview cookies. `lib/session.ts` resolves the role; `lib/presentation.ts` resolves the domain (`getActiveDomain`, `DOMAIN_META`).
- **AI is GitHub-driven** (`githubDriven: true`); ML/SDSE are drive-workflow. A domain's behaviour is **data-driven**, not hardcoded per screen.
- **"Team Lead" = alias for Mentor** (the Student Mentor leads the team) — 5 roles unchanged; the switcher simply relabels.

## 3. Navigation architecture
- `lib/nav/nav.config.ts` holds `NAV[role]` (drive nav, unchanged) and a new `GITHUB_NAV[role]` (AI-only).
- `components/layout/sidebar.tsx` composes `NAV[role] + (domain === "AI" ? GITHUB_NAV[role] : [])` and shows a domain chip. So AI users see **both** the drive nav and a "GitHub · AI" section; ML/SDSE see only the drive nav.
- Icons resolve through a fixed `NavIcon` map (brand-free lucide icons).

## 4. Dashboard architecture
Per-role GitHub dashboards + **shared detail routes** (role-agnostic, deep-linked):
| Role | Screens |
|---|---|
| Teacher | Org dashboard · Team comparison · Project comparison · Repos · Mentor performance · Student contributions |
| Mentor | Team dashboard · Repository · Issues · **PR review queue** · Student performance |
| Mentee | My repository · Issues (self-assign) · My PRs · Contribution analytics · Milestones |
| Admin/LCC | AI domain overview (org analytics + team comparison + activity) |
| Shared | `github/repos/[repo]` · `github/issues/[id]` · `github/pulls/[id]` · `github/workflow` |

Reusable GitHub composites: `workflow-pipeline`, `issue-fanout`, `review-eval-card`, `pr-review-form`, `repo-card`, `milestone-bar`, `team-compare`, `student-table`, `issue-list`, `pr-list`, `activity-feed`, `org-overview`, `gh-badges`.

## 5. GitHub-workflow architecture
**Issue → Self-Assign → Branch → Develop → Pull Request → Mentor Review → Merge → Milestone.** Modelled as data, surfaced everywhere:
- **Multi-mentee per issue** — `issue-fanout` shows every attempt: who's working, whose PR merged, which were rejected and **why**.
- **Learning-oriented evaluation** — each review records understanding/explanation/technical-depth scores + notes, stored historically (`review-eval-card`, `pr-review-form`).
- **Derived milestones** — milestone progress reflects merged work, not self-reports.
- **Read access (RBAC, Phase-2 enforced):** Admin/LCC see all domains; Teacher their domain; Mentor their team; Mentee themselves. In Phase 1 this is previewed via the switchers.

## 6. Mock data model (`client/lib/mock/github.ts`)
Entities: `MockOrg`, `MockGhTeam`, `MockRepo`, `MockProject` (**`teamIds: string[]` — 1..N teams**), `MockGhMilestone`, `MockIssue`, `MockIssueAttempt`, `MockPR` (one issue → many), `MockReview` (+ learning scores), `MockCommit`, `MockGhPerson`. All counts/rates come from **derived selectors** (`orgAnalytics`, `teamAnalytics`, `studentAnalytics`, `mentorAnalytics`, `orgActivity`) so nothing is hand-inconsistent.

## 7. Deferred to later phases (NOT in Phase 1)
Backend/Express APIs, Prisma/PostgreSQL, Google OAuth + server-side RBAC enforcement, GitHub App/webhook wiring, Discord/Calendar/Groq, ECS/infra. The `server/` tree is untouched. Per-domain GitHub org webhooks + read tokens are documented in `docs/github-setup.html` as Phase-2 groundwork.

## 8. Verification
- `cd portal/client && npm run build` (clean, all routes) · `npm test` (existing suite green).
- `npm run dev` → toggle **Viewing as** (incl. Team Lead) × **Domain**: AI shows the GitHub nav + drive nav; ML/SDSE show only the drive nav. Walk Teacher → team/project comparison; Mentor → PR review queue → review-eval; Mentee → issue → self-assign → PR fan-out.

## Open questions for review
1. Is the AI org **one org with many team repos**, or **one org per domain**? (Mock assumes one AI org; `docs/github-setup.html` documents the per-domain-org webhook either way.)
2. Should Admin/LCC get the deeper Teacher-style comparison screens, or is the single overview enough?
3. Confirm the learning-evaluation rubric (3 dimensions, 1–5) before it's persisted in Phase 3.
