# Testing Scenarios — Domain Validation

Domain-wise validation scenarios for the Forge Testing Portal. **Presentation mode only** —
every scenario runs on mock data (no DB, APIs, or external sync). Testers walk these in the
portal (`/testing` → a domain → guided sequential steps).

Each domain auto-populates a realistic environment (teachers, mentors, team leads, students,
teams, repositories, milestones, deliverables) using the real tester accounts, so the
experience matches production.

## Checklist categories (every domain)
1. **User Management** — Invite User · Assign Role · Assign Domain · Verify Access
2. **Teacher** — Domain Analytics · Team & Progress Tracking
3. **Mentor** — Weekly Reviews · Mentee Performance
4. **GitHub Integration** — domain-specific (below)
5. **Team Lead** — Team Management · Repository Monitoring
6. **Mentee** — Tasks & Milestones · Submissions · My Repository
7. **Discord Integration** — Connect Server · Validate Sync
8. **Calendar Integration** — Connect Calendar · Create Event · Verify Visibility
9. **Notifications** — Verify Notifications · Reminder Workflow

---

## AI Domain — Organization model
**Structure:** GitHub Organization → Teams → Shared Repositories → Issues → PRs → Reviews.
**Environment:** AI Group 07 & AI Group 03; org repos `engageiq-ai_1`, `hireflow-ai_2`.

Scenarios validate:
- Organization overview (teams, repositories, contribution analytics)
- Team & shared-repository views with Issues + Pull Requests
- Per-student contribution analytics across the shared repo
- Pull-request review workflow (open/merged + review state)

---

## ML Domain — Per-student repositories
**Structure:** Team → Students → **individual repositories** (each student owns one).
**Environment:** Insight Squad; repos `anwesha/forecast`, `khushi/forecast`, `nikith/forecast`.

Scenarios validate:
- Teams → per-student repository grid (one repo per student)
- Student repository tracking (each student's own commits/PRs/branches/progress)
- Side-by-side student comparison within the team

---

## DVA Domain — Shared repo + deliverables/analytics
**Structure:** Team → **shared repository** → Deliverables → Analytics Projects.
**Environment:** Dashboard Crew; repo `dva-team/viz-stories`.

Scenarios validate:
- Shared repository with full team context
- Deliverables + analytics projects tracked alongside milestones
- Per-student contribution monitoring on the shared repo

---

## SDSE Domain — Shared repo + engineering
**Structure:** Team → **shared repository** → Deliverables → Engineering Work.
**Environment:** Shipyard Team; repo `sdse-team/shipyard`.

Scenarios validate:
- Shared engineering repository (branches, releases, activity)
- Team deliverables + milestones
- Per-student engineering contribution monitoring

---

## Cross-cutting integration scenarios (all domains)
- **Discord:** connect a server (mock), view the connection, validate activity sync.
- **Calendar:** connect a calendar (mock), create an event, verify team visibility.
- **Notifications:** verify the notification list + unread count and the reminder workflow.

## Presentation-mode limitations (per scenario)
- **Integrations don't actually connect** — Discord/Calendar/GitHub "connect" steps render
  the connected state from mock data; no OAuth, webhooks, or live sync occur.
- **No emails are sent** — invitations and issue reports are simulated; issue reports are
  recorded locally and would email `shaik.tajuddin2024@nst.rishihood.edu.in` in production.
- **GitHub repositories are mock** — repo names/activity are fixtures; real org/repos sync
  only in Phase 2.
- **Progress is per-browser** — Resume state is stored in the browser (localStorage); in
  production it would be persisted server-side per tester.
