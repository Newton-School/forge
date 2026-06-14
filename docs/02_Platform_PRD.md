# Product Requirements Document
## Profile Building Drive Management Platform (PBDMP)
### A Centralized, Multi-Domain Mentorship, Project & Evaluation Platform

> **Document type:** Product Requirements Document (timeless product specification)
> **Status:** Draft v1.0
> **Scope:** AI · ML · SDSE domains (extensible to any domain)
> **Source of truth for analysis:** [01_RawDocs_Analysis_Report.md](01_RawDocs_Analysis_Report.md)

---

> ### A note on what this document deliberately excludes
> This PRD specifies **what the platform must be and do** — its capabilities, data, workflows, roles, integrations, security, and architecture. It contains **no development timelines, sprint plans, release dates, Gantt charts, story points, or resource allocations**. Every drive-specific deadline, phase, milestone, and review cycle extracted from the source material is treated as a **configurable, admin-managed entity inside the platform**, never as a hardcoded schedule. The "MVP / Phase 2 / Phase 3" sections describe **capability tiers (scope layers)**, not calendar phases.

---

## Table of Contents

1. Executive Summary
2. Product Vision
3. Problem Statement
4. Stakeholder Analysis
5. User Personas
6. Complete RBAC Matrix
7. Functional Requirements
8. Non-Functional Requirements
9. Database Schema Design
10. Entity Relationship Model
11. User Flows
12. Wireframe Descriptions
13. API Specifications
14. Integration Architecture
15. Email Architecture
16. Notification Matrix
17. Reporting Architecture
18. Analytics Architecture
19. Security Architecture
20. Deployment Architecture
21. Scalability Considerations
22. Complete Product Roadmap (Capability Tiers)
23. Capability Tier 1 — MVP Scope
24. Capability Tier 2 Scope
25. Capability Tier 3 Scope
26. Configurability Model (Dynamic Drive Structure)
27. Risk Assessment
28. Success Metrics

---

## 1. Executive Summary

The **Profile Building Drive Management Platform (PBDMP)** is a single, unified web application that replaces the current patchwork of Discord threads, shared spreadsheets, and ad-hoc email to run the **Summer Profile Building Drive** end to end. Today the drive is operated through a multi-tab tracking workbook (Mentee Updates, Mentor Dashboard, Weekly Reviews), Discord channels, and GitHub repositories — with humans manually flagging inactivity, chasing missing updates, and routing concerns over email. This works at small scale but loses visibility and accountability as the drive spans **multiple domains, dozens of groups, hundreds of students, and a four-tier review hierarchy**.

PBDMP consolidates all of this into **one dashboard per role**. It implements the drive's existing **L1→L4 review cadence** (mentee updates every 2 days → mentor status → mentor weekly review → teacher weekly review) as an automated workflow engine; it reproduces the existing **auto-flag and escalation rules** as scheduled jobs and notifications; it provides a built-in **email center** and **concern-management ticketing system**; and it integrates **GitHub, Discord, and Google Calendar** so progress is measured from real activity, not self-report alone.

Critically, the platform is **domain-agnostic and fully configurable**. The AI "Pod" model, the ML "single assigned project" model, and the SDSE "engineering team" model are all expressed through the same configurable primitives (domains, teams, projects, milestones, deliverables, review cycles, rubrics, and escalation rules) that **Admin and LCC manage through the UI** — never through code changes.

**Primary outcome:** a single source of truth where any authorized stakeholder can understand any student's journey — progress, blockers, feedback, GitHub/Discord activity, and evaluation — without needing additional context.

---

## 2. Product Vision

> **Vision statement.** *Make every student's growth visible, every mentor accountable, and every blocker resolvable — in one place, for every domain, automatically.*

The platform exists to convert a high-touch, manually-coordinated mentorship program into a **self-organizing accountability system**. Structure should beat motivation: the system, not the staff, should remember who owes an update, which blocker has gone stale, which team has stopped committing, and which concern is unresolved.

**Guiding product principles (derived from the drive's own stated beliefs):**

- **Visibility over reporting.** Progress is surfaced from activity (updates, commits, messages, reviews), not assembled by hand.
- **Accountability loops, not surveillance.** Every role has both a "do your part" surface and a "see who hasn't" surface — including mentees rating mentors (360°).
- **Configuration over code.** The drive's shape (phases, cadences, thresholds, rubrics) changes year to year; the platform absorbs that through admin configuration.
- **One journey, many lenses.** The same underlying record is viewed differently by Mentee, Mentor, Team Lead, Teacher, LCC, and Admin — scoped by RBAC.
- **Closed-loop concerns.** Nothing raised disappears: every blocker and concern becomes a tracked ticket with a defined lifecycle and an escalation path.

---

## 3. Problem Statement

The Summer Profile Building Drive coordinates four tiers of people (Mentees, Student Mentors, Faculty/Teachers, LCC) across multiple domains, two parallel project tracks (group + individual), and a dense calendar of reviews, hackathons, presentations, and peer interviews. The current operating model has structural weaknesses:

| Problem | Evidence in current model | Consequence |
|---|---|---|
| **Fragmented tooling** | Updates in spreadsheets, discussion in Discord, code in GitHub, escalation over email | No single source of truth; context is lost between tools |
| **Manual accountability** | Auto-flags exist only via a "mentor bot" on one sheet; LCC manually "follows up on missing reports" | Inactivity caught late; relies on human vigilance |
| **No enforced workflow** | L1–L4 cadence lives in spreadsheet conventions ("append only — do not delete rows") | Reviews skipped; no guarantee mentor→teacher handoff happens |
| **Concerns routed informally** | Blockers in a sheet column; concerns emailed to LCC + named individuals | No ticket lifecycle, no SLA, no resolution tracking |
| **Inconsistent governance across domains** | AI Pod ≠ ML single-project ≠ SDSE engineering team; each with its own milestone/branch/role scheme | No unified oversight; LCC can't compare domain health |
| **No real-time activity signal** | GitHub/Discord activity reviewed manually at evaluation time | "Students who push code only in bulk at the end" go unnoticed until too late |
| **Limited analytics** | A "Dashboard Sheet" with manual totals | No drill-down, no trend lines, no early-risk detection |

**The platform must solve all seven** while remaining flexible enough that next year's drive — with different phases, thresholds, domains, or rubrics — runs on the same software without redevelopment.

---

## 4. Stakeholder Analysis

| Stakeholder | Interest in the platform | Success looks like | Pain removed |
|---|---|---|---|
| **Mentee** | Clarity on what to do, where they stand, how to get unblocked | Always knows next task/deadline; feedback visible; concerns heard | No more guessing; updates take 2–3 min |
| **Student Mentor** | Manage ~5 mentees, stay accountable, surface risks | One screen for all mentees; auto-flagged risks; fast review entry | No manual chasing; review entry guided |
| **Team Lead** | Engineering/delivery ownership of a team | Issue/PR visibility, blocker triage, weekly summary auto-prepared | No manual status compilation |
| **Teacher / Faculty** | Domain-wide oversight, gate approvals, mentor quality | All groups visible; L4 reviews queued; mentor performance measurable | No spreadsheet hunting; risks pre-surfaced |
| **LCC** | Cross-domain coordination, accountability, concern resolution | Drive health at a glance; escalations routed; bulk comms in-app | No manual tracking-sheet auditing |
| **Admin** | System integrity, configuration, user lifecycle | Provision users, configure drive, audit everything | No code changes to reshape the drive |
| **Organizing Team** (Nipun Sir, Kushagra Sir) | Final escalation authority | CC'd on every concern; serious cases surfaced | Nothing critical slips through |
| **External audience** (Phase 4 showcase, recruiters) | View finished work | (Out of MVP scope) Public showcase pages | — |

---

## 5. User Personas

**P1 — Mentee "Sneha" (AI/ML, Squad Alpha).** First/second-year student. Logs in every two days to post a 4-field update (Worked On, Learning, Blocker, Next Goal), checks her milestones and mentor feedback, submits deliverables, and raises a concern when stuck. Wants the lowest-friction possible update flow and a clear "what's due next."

**P2 — Student Mentor "Mentor A" (manages 5 mentees across squads).** Second-year student. Twice a week sets each mentee's status and an action note; every Saturday writes the weekly review (Progress Summary, Strength, Improvement Area, Mentor Status). Needs a dashboard that pre-flags "No Updates 4+ Days" and "Repeated Blocker" so attention goes where it's needed.

**P3 — Team Lead "Aniket" (SDSE).** Owns delivery for one engineering team. Triages issues/PRs, watches the branch pipeline, escalates stalled PRs, and produces the weekly mentor summary. Needs GitHub-synced issue/PR state and blocker SLAs.

**P4 — Teacher "Bipul Kumar" (Faculty Mentor, one domain).** Reviews all groups in his domain, runs faculty gates (proposal approval, milestone sign-off, final panel), and completes L4 weekly reviews every Sunday. Needs domain-scoped visibility and a review queue, plus mentor-performance signals.

**P5 — LCC member "Priya" (cross-domain coordinator).** Monitors drive health across all domains, chases missing updates, resolves concerns as first point of contact, runs hackathons and engagement events, sends bulk announcements, and maintains demerit records. Needs the global dashboard, the concern queue, and the email center.

**P6 — Admin "Patrick" (system owner).** Pre-creates all users, configures domains/phases/milestones/thresholds/rubrics, manages email templates and integrations, and reviews audit logs. Needs total control via UI and complete auditability.

---

## 6. Complete RBAC Matrix

### 6.1 Role definitions & scope

| Role | Scope | Inherits visibility of |
|---|---|---|
| **Admin** | Global, all data + system config | Everything |
| **LCC** | Global (read), coordination actions | All domains, teams, users (no system config) |
| **Teacher** | **Single domain** (or assigned domains) | All teams/mentors/students in their domain(s) |
| **Mentor** | **Assigned teams/mentees** | Their mentees' full records |
| **Team Lead** | **Single team** | Their team's members, issues, PRs |
| **Mentee** | **Self + own team (limited)** | Own records, team milestones, assigned mentor/teacher |

### 6.2 Permissions matrix

Legend: ✅ Full · 🔵 Own/assigned scope · 👁 Read-only · ➖ None

| Capability | Admin | LCC | Teacher | Mentor | Team Lead | Mentee |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **User Management** |||||||
| Create / invite users | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Edit / deactivate users | ✅ | 👁 | 👁(domain) | ➖ | ➖ | ➖ |
| Assign roles | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Reset another user's password | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Org Structure** |||||||
| Manage domains | ✅ | 👁 | 👁(own) | ➖ | ➖ | ➖ |
| Manage teams/squads/pods | ✅ | 🔵 | 🔵(domain) | 👁 | 👁 | 👁(own) |
| Assign mentor↔team↔teacher | ✅ | 🔵 | 🔵(domain) | ➖ | ➖ | ➖ |
| **Drive Configuration** |||||||
| Configure phases/gates | ✅ | 🔵 | ➖ | ➖ | ➖ | ➖ |
| Configure milestones/deliverables | ✅ | 🔵 | 🔵(domain) | 🔵(team) | ➖ | ➖ |
| Configure review cadence/thresholds | ✅ | 🔵 | ➖ | ➖ | ➖ | ➖ |
| Configure rubrics/weights | ✅ | 🔵 | 🔵(domain) | ➖ | ➖ | ➖ |
| **Updates & Reviews** |||||||
| Submit L1 mentee update | ➖ | ➖ | ➖ | ➖ | ➖ | 🔵 |
| Submit L2 mentor status | ✅ | 👁 | 👁 | 🔵 | ➖ | ➖ |
| Submit L3 mentor weekly review | ✅ | 👁 | 👁 | 🔵 | ➖ | ➖ |
| Submit L4 teacher weekly review | ✅ | 👁 | 🔵 | 👁 | ➖ | ➖ |
| Approve faculty gates | ✅ | 👁 | 🔵 | ➖ | ➖ | ➖ |
| Submit mentee→mentor feedback (360°) | ➖ | 👁 | 👁 | ➖ | ➖ | 🔵 |
| **Projects & Tasks** |||||||
| Create/assign tasks | ✅ | 🔵 | 🔵 | 🔵 | 🔵 | ➖ |
| Update task progress | ✅ | 👁 | 👁 | 🔵 | 🔵 | 🔵(own) |
| Approve/reject deliverables | ✅ | 👁 | 🔵 | 🔵 | 🔵 | ➖ |
| Submit deliverables | ➖ | ➖ | ➖ | ➖ | 🔵 | 🔵 |
| **Concerns** |||||||
| Raise concern | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View concern (own/raised) | ✅ | ✅ | 🔵 | 🔵 | 🔵 | 🔵 |
| Triage / assign / resolve concern | ✅ | ✅ | 🔵(domain) | ➖ | ➖ | ➖ |
| **Communications** |||||||
| Send bulk email | ✅ | ✅ | 🔵(domain) | 🔵(team) | ➖ | ➖ |
| Send announcement | ✅ | ✅ | 🔵 | 🔵 | 🔵 | ➖ |
| Manage email templates | ✅ | 🔵 | ➖ | ➖ | ➖ | ➖ |
| **Analytics & Reporting** |||||||
| Global analytics | ✅ | ✅ | ➖ | ➖ | ➖ | ➖ |
| Domain analytics | ✅ | ✅ | 🔵 | ➖ | ➖ | ➖ |
| Team analytics | ✅ | ✅ | 🔵 | 🔵 | 🔵 | ➖ |
| Self analytics | ✅ | ✅ | ✅ | ✅ | ✅ | 🔵 |
| Generate/export reports | ✅ | ✅ | 🔵 | 🔵 | 🔵 | ➖ |
| **System** |||||||
| View audit logs | ✅ | 👁(scoped) | ➖ | ➖ | ➖ | ➖ |
| Manage integrations (GitHub/Discord/Calendar) | ✅ | 👁 | ➖ | ➖ | ➖ | ➖ |
| Demerit management | ✅ | 🔵 | 👁 | 👁 | ➖ | ➖ |

> **Enforcement principle:** RBAC is enforced server-side on every API call via (a) **role** and (b) **scope** (domain/team/self ownership). The matrix above is the canonical authorization spec; the UI hides what the API forbids, but the API is the boundary.

---

## 7. Functional Requirements

Requirements are grouped by capability area. **FR-x.y** identifiers are stable references. "Configurable" means Admin/LCC-managed at runtime.

### 7.1 Authentication & User Lifecycle
- **FR-1.1** No public signup. All accounts are **pre-created by Admin** (single or **bulk CSV import** with role, domain, team).
- **FR-1.2** On creation, the system sends an **email invitation** with a one-time, time-limited activation link.
- **FR-1.3** User logs in with **predefined credentials**; **forced password change on first login**.
- **FR-1.4** **Password reset via email** (time-limited token); Admin can also trigger a reset.
- **FR-1.5** Account states: `Invited`, `Active`, `Suspended`, `Deactivated`. Suspended/deactivated users cannot log in but their records persist.
- **FR-1.6** Optional MFA (TOTP) — configurable, enforced per-role.
- **FR-1.7** Session management: configurable idle/absolute timeouts; "log out everywhere."

### 7.2 Organizational Structure
- **FR-2.1** Admin/LCC manage **Domains** (AI, ML, SDSE, + arbitrary new domains) with a domain **governance profile** (team model, default milestones, branch policy, rubric).
- **FR-2.2** Manage **Teams** (aliased per domain as Pod/Group/Team/Squad) within a domain, each with a name, mentor, teacher, and members.
- **FR-2.3** Assign relationships: **Teacher→Domain**, **Mentor→Team(s)**, **Mentee→Team**, **Team Lead→Team**. A mentor may hold multiple teams; a mentee belongs to exactly one team per drive.
- **FR-2.4** Support a **Squad** cross-cut (Alpha/Beta/Gamma) independent of team, as seen in tracking sheets.

### 7.3 Mentee Experience (L1)
- **FR-3.1** Submit an **update** with fields: **Worked On, Learning, Blocker, Next Goal** (cadence configurable, default every 2 days). Append-only history.
- **FR-3.2** View: assigned **mentor, teacher, team, domain, squad**; **milestones, deadlines, phases, tasks**; **submissions**; **mentor feedback**; **GitHub progress, Discord updates, calendar events**.
- **FR-3.3** Submit **weekly reviews / reflections**, **deliverables** (file/link upload), and respond to faculty-gate revision requests.
- **FR-3.4** Submit **360° mentor feedback**: *Was Mentor Available? / Was Feedback Useful? / Comments* (cadence configurable).
- **FR-3.5** **Raise a concern** (see §7.8) from anywhere.

### 7.4 Mentor Experience (L2/L3)
- **FR-4.1** **Mentor Dashboard**: one row per mentee with Updates-This-Week, Last Update, **Blocker Streak**, **Status (L2)**, **Days Since Update**, **L2 Comment**, **Action Needed**, and the 🟢🟡🔴 colour state — auto-populated.
- **FR-4.2** Set **L2 status** (`Doing Well` / `Needs Consistency` / `No Updates 4+ Days`) + comment + action (cadence configurable).
- **FR-4.3** Submit **L3 weekly review** (Progress Summary, Strength, Improvement Area, **Mentor Status** = `On Track`/`At Risk`/`Needs Discussion`); system pre-fills the **Auto Flag** column.
- **FR-4.4** Create/assign **tasks**, define/break down **milestones & deliverables**, **approve/reject** deliverables with feedback.
- **FR-4.5** **Schedule reviews/meetings** (calendar), **track attendance**, **track milestone completion**, **view GitHub/Discord activity** per mentee.
- **FR-4.6** **Send announcements** to assigned teams; **raise concerns**.

### 7.5 Team Lead Experience
- **FR-5.1** View team members, assigned **issues** and **pull requests** (GitHub-synced), branch-pipeline status.
- **FR-5.2** Triage issues, flag **blockers** with SLA timers, escalate stalled PRs.
- **FR-5.3** Auto-assembled **weekly mentor summary** draft (from issues/PRs/updates).
- **FR-5.4** Approve/reject team deliverables; raise concerns.

### 7.6 Teacher Experience (L4)
- **FR-6.1** **Domain-scoped** access only — all mentors, teams, students in their domain(s).
- **FR-6.2** **L4 weekly review queue**: set **Teacher Decision** (`Continue`/`Monitor`/`Schedule Discussion`) + Teacher Notes for each mentee (cadence configurable, default Sundays).
- **FR-6.3** Run **faculty gates**: proposal approval (`Approved`/`Revise & Resubmit`/`Rejected`), milestone sign-off, final-panel scoring against the configured rubric.
- **FR-6.4** Review **mentor performance** (review completion %, mentee outcomes, 360° feedback).
- **FR-6.5** Track milestone completion & deliverables across the domain; **generate reports**; **raise concerns**; **escalate to LCC**.

### 7.7 LCC Experience
- **FR-7.1** **Global monitoring**: all domains, projects, mentors, students; **drive-health** dashboard (completion rates, delayed deliverables, inactive teams, escalations).
- **FR-7.2** Onboarding tracking (who has/hasn't joined Discord / activated account); chase lists.
- **FR-7.3** **Concern queue**: triage, assign, resolve, track SLA (first point of contact).
- **FR-7.4** **Email center**: compose, bulk-send, schedule, target by domain/team/role (see §15).
- **FR-7.5** **Demerit & accountability** records (warnings, demerits, policy thresholds, escalation to organizing team).
- **FR-7.6** Manage hackathons, peer interviews, inter-group presentations, engagement events as **calendar + tracked activities**.

### 7.8 Concern Management System
- **FR-8.1** Any role can **raise a concern** with: **Category** (`Mentor`, `Mentee`, `Teacher`, `Team Lead`, `Team Member`, `Domain Issue`, `Technical Issue`, `Process Issue`, `Other`), title, description, severity, optional attachments, optional anonymity.
- **FR-8.2** On submit, the system **creates a ticket** and **auto-generates an email** to **LCC**, **CC** the configured organizing-team contacts (default: Nipun Sir, Kushagra Sir).
- **FR-8.3** **Ticket lifecycle** (configurable): `Open → Acknowledged → In Progress → Escalated → Resolved → Closed` (+ `Reopened`). Each transition is logged with actor, timestamp, note.
- **FR-8.4** **SLA timers** per severity; breach triggers escalation + notification.
- **FR-8.5** Blockers raised in updates (L1) can be **promoted to concerns**; concerns link back to the student/team/milestone.
- **FR-8.6** Resolution requires a resolution note; reporter is notified and can reopen within a configurable window.

### 7.9 Projects, Milestones, Tasks, Deliverables
- **FR-9.1** Two project tracks per applicable domain: **Group Project** and **Individual Project** (track count configurable per domain).
- **FR-9.2** **Milestones** with: name, sequence, phase, key output, **acceptance criteria** (checklist), optional **defense questions**, due date, status, completion %.
- **FR-9.3** **Tasks** with: title, description, assignee, assigned-by, assigned/due dates, status, progress %, mentor feedback, next action.
- **FR-9.4** **Deliverables** with type templates (e.g., ML's 7: Source Code, Data Pipeline, Visualizations, Model Evaluation, Technical Report PDF, 10-slide deck, 3-min video), submission, review verdict.
- **FR-9.5** **Skill Development Tracker**: skill, starting level, current level, evidence (feeds skill-growth analytics & rubric).

### 7.10 Faculty Gates & Evaluation
- **FR-10.1** Configurable **gates** that block phase progression until passed (proposal, milestone sign-off, final panel).
- **FR-10.2** Configurable **weighted rubric engine** (e.g., 35/25/20/15/5 top-team rubric; or SDSE equal-weight 4-dimension) producing scores and rankings.
- **FR-10.3** **Top-team / top-performer selection** computed from rubric inputs (including GitHub/Discord analytics and skill growth).

### 7.11 Communications & Notifications
- **FR-11.1** **Email center** (§15) and **automated notifications** (§16) covering all 13 mandated triggers.
- **FR-11.2** **Announcements** scoped by role/domain/team, shown in-app and optionally emailed/Discord-posted.

### 7.12 Integrations
- **FR-12.1** **GitHub** (§14.1): commits, PRs, issues, reviews, branch activity, contribution, milestone completion.
- **FR-12.2** **Discord** (§14.2): participation, announcements, team channels, activity.
- **FR-12.3** **Google Calendar** (§14.3): mentor meetings, review meetings, deadlines, milestones, events.

### 7.13 Administration & Audit
- **FR-13.1** Full **system configuration** UI (domains, phases, milestones, deliverables, review cycles, deadlines, thresholds, rubrics, email templates, SLAs).
- **FR-13.2** **Audit log** of every privileged and data-mutating action (who/what/when/before/after).
- **FR-13.3** **Data export** (CSV/XLSX) mirroring the original tracking-sheet tabs for continuity.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | P95 page/API response < 500 ms under normal load; dashboard list views paginated/virtualized; analytics queries served from pre-aggregated rollups, P95 < 2 s. |
| **Availability** | Target 99.5% monthly uptime; graceful degradation if an integration (GitHub/Discord/Calendar) is down — core flows must not block. |
| **Scalability** | Support the full corpus scale (multiple domains × ~18 groups × ~5 mentees) and an order of magnitude beyond without redesign (see §21). |
| **Reliability** | Idempotent integration syncs; retried/queued external calls; no data loss on partial failures; append-only update history. |
| **Security** | See §19 — RBAC enforced server-side, encryption in transit/at rest, audit logging, least privilege. |
| **Usability** | Mentee update flow completable in ≤ 2–3 min; ≤ 3 clicks to any primary action; mobile-responsive. |
| **Accessibility** | WCAG 2.1 AA: keyboard nav, contrast, screen-reader labels. |
| **Maintainability** | Configuration-driven (no redeploy to change drive structure); typed API contracts; documented schema. |
| **Observability** | Structured logs, metrics, error tracking, integration-sync health dashboards. |
| **Data integrity** | Soft-delete for user-facing records; FK constraints; audit trail; timezone-aware timestamps (store UTC). |
| **Localization-ready** | i18n scaffolding (drive references Indian-language content in one domain). |
| **Compliance** | Configurable data-retention; PII access restricted by RBAC; right-to-export. |

---

## 9. Database Schema Design

Logical schema (relational; PostgreSQL assumed). Types abbreviated. All tables carry `id (uuid pk)`, `created_at`, `updated_at`, and where relevant `deleted_at` (soft delete).

### 9.1 Identity & access
```
users(id, email[unique], full_name, status[Invited|Active|Suspended|Deactivated],
      password_hash, must_change_password[bool], mfa_secret?, last_login_at,
      discord_username?, github_username?, created_by_fk→users)
roles(id, key[Admin|LCC|Teacher|Mentor|TeamLead|Mentee], display_name)
user_roles(id, user_fk, role_fk, scope_type[Global|Domain|Team|Self], scope_id?)   -- multi-role, scoped
invitations(id, user_fk, token[unique], expires_at, accepted_at?)
password_resets(id, user_fk, token[unique], expires_at, used_at?)
sessions(id, user_fk, issued_at, expires_at, revoked_at?, ip, user_agent)
```

### 9.2 Org structure
```
domains(id, name, key, governance_profile_json, display_aliases_json, active[bool])
teams(id, domain_fk, name, alias_type[Pod|Group|Team|Squad], mentor_fk→users,
      teacher_fk→users, team_lead_fk→users?, github_repo_url?, discord_channel_id?)
squads(id, name)                          -- Alpha/Beta/Gamma cross-cut
team_members(id, team_fk, user_fk, member_role[Mentee|Contributor|Maintainer|...],
             squad_fk?, github_permission?)
```

### 9.3 Drive configuration (the "dynamic structure" core)
```
drives(id, name, year, active[bool])
phases(id, drive_fk, name, sequence, duration_label?, theme?)                  -- configurable
gates(id, drive_fk, phase_fk, name, verdict_options_json, blocks_progression[bool])
review_cycles(id, drive_fk, level[L1|L2|L3|L4], owner_role, cadence_rule,       -- e.g. "every 2 days","weekly:SAT"
              field_schema_json, status_enum_json)
escalation_rules(id, drive_fk, name, condition_json, threshold_value, threshold_unit,
                 action[Flag|Notify|Escalate], target_role, severity?)          -- 3/5/7-day, repeated-blocker, etc.
rubrics(id, drive_fk, domain_fk?, name, kind[Gate|TopTeam|Mentor])
rubric_dimensions(id, rubric_fk, name, weight, measured_by)                     -- 35/25/20/15/5 etc.
```

### 9.4 Projects, milestones, tasks, deliverables
```
projects(id, team_fk, type[Group|Individual], owner_fk→users?, name, problem_statement,
         status, proposal_status[Draft|Submitted|Approved|ReviseResubmit|Rejected])
milestones(id, project_fk?, team_fk?, phase_fk?, name, sequence, key_output,
           acceptance_criteria_json, defense_questions_json?, due_at, status,
           completion_pct, signed_off_by_fk?, signed_off_at?)
tasks(id, project_fk, milestone_fk?, title, description, assignee_fk, assigned_by_fk,
      assigned_at, due_at, status, progress_pct, next_action)
deliverable_types(id, domain_fk?, name)                                        -- e.g. "3-min Demo Video"
deliverables(id, project_fk, milestone_fk?, type_fk, submitted_by_fk, submitted_at,
             artifact_url, review_status[Pending|Approved|Rejected], reviewer_fk?, feedback)
skill_assessments(id, user_fk, skill, starting_level, current_level, evidence, assessed_by_fk)
```

### 9.5 Reviews & feedback (L1–L4 + 360°)
```
mentee_updates(id, user_fk, team_fk, squad_fk?, date, worked_on, learning, blocker, next_goal)   -- L1, append-only
mentor_status(id, mentee_fk, mentor_fk, date, updates_this_week, last_update_at, blocker_streak,
              status_l2, days_since_update, comment, action_needed, colour_state)                 -- L2
weekly_reviews(id, week_no, mentee_fk, mentor_fk, domain_fk, squad_fk?,
               progress_summary, strength, improvement_area, auto_flag, mentor_status,             -- L3
               teacher_decision?, teacher_notes?, teacher_fk?, l4_completed_at?)                    -- L4
mentor_feedback(id, mentee_fk, mentor_fk, date, mentor_available[bool],
                feedback_useful[bool], comments)                                                   -- 360°
mentorship_logs(id, mentor_fk, mentee_fk, date, discussion_summary, action_items, next_checkin_at) -- Section G
attendance(id, event_fk, user_fk, status[Present|Absent|Excused])
evaluations(id, rubric_fk, subject_type[Team|User], subject_id, scores_json, total, rank, evaluator_fk)
```

### 9.6 Concerns & demerits
```
concerns(id, raised_by_fk, category[Mentor|Mentee|Teacher|TeamLead|TeamMember|Domain|Technical|Process|Other],
         subject_user_fk?, team_fk?, domain_fk?, milestone_fk?, title, description, severity,
         anonymous[bool], status[Open|Acknowledged|InProgress|Escalated|Resolved|Closed|Reopened],
         assigned_to_fk?, sla_due_at?, resolution_note?, resolved_at?)
concern_events(id, concern_fk, actor_fk, from_status, to_status, note, at)
demerits(id, user_fk, reason, points, issued_by_fk, policy_ref, escalated[bool])
```

### 9.7 Communications & notifications
```
email_templates(id, name, subject, body_richtext, variables_json, owner_role)
emails(id, sender_fk, subject, body, recipients_json, cc_json, attachments_json,
       status[Draft|Scheduled|Sent|Failed], scheduled_at?, sent_at?)
announcements(id, author_fk, scope_type, scope_id, title, body, channels_json)  -- in-app/email/discord
notifications(id, user_fk, type, payload_json, read_at?, sent_channels_json)
notification_rules(id, trigger_key, audience_json, cc_json, channels_json, template_fk, active)
```

### 9.8 Integrations & audit
```
integration_accounts(id, provider[GitHub|Discord|GoogleCalendar], scope_type, scope_id,
                      external_id, credentials_ref, status, last_synced_at)
github_activity(id, team_fk, user_fk?, type[Commit|PR|Issue|Review], external_id,
                title, state, url, occurred_at, raw_json)
discord_activity(id, team_fk, user_fk?, channel_id, type[Message|Join|Reaction|Announcement],
                 occurred_at, raw_json)
calendar_events(id, scope_type, scope_id, title, type[MentorMeeting|Review|Deadline|Milestone|Event],
                starts_at, ends_at, external_event_id, attendees_json)
audit_logs(id, actor_fk, action, entity_type, entity_id, before_json, after_json, ip, at)
```

---

## 10. Entity Relationship Model

```
                    ┌────────┐         ┌──────────┐        ┌──────────┐
                    │ Drive  │1──────* │  Phase   │1─────* │   Gate   │
                    └───┬────┘         └──────────┘        └──────────┘
            1│  │1   │1        │1            │1
             *│  │*   │*        │*            │*
       ┌───────────┐ ┌──────────────┐ ┌─────────────────┐ ┌──────────┐
       │review_cycle│ │escalation_rule│ │ rubric(+dims)  │ │  ...     │
       └───────────┘ └──────────────┘ └─────────────────┘ └──────────┘

   ┌────────┐ 1     * ┌────────┐ 1    * ┌──────┐ 1   * ┌─────────────┐
   │ Domain │─────────│  Team  │────────│ User │       │ team_members│
   └───┬────┘ (teacher)└──┬────┘(mentor,└──┬───┘*─────1└──────┬──────┘
       │                  │  team_lead)    │  (via user_roles, scoped)  │
       │1                 │1               │1                          │
       │*                 │*               │*                          ▼
   ┌──────────┐      ┌─────────┐     ┌──────────────┐  ┌──────────┐  ┌──────┐
   │ projects │1───* │milestone│1──* │ deliverables │  │mentee_   │  │squad │
   └────┬─────┘      └────┬────┘     └──────────────┘  │updates L1│  └──────┘
        │1                │1                            └────┬─────┘
        │*                │*                                 │ aggregates
   ┌────────┐        ┌──────────┐                       ┌────▼──────┐
   │ tasks  │        │ defense  │                       │mentor_    │ L2
   └────────┘        │questions │                       │status     │
                     └──────────┘                       └────┬──────┘
                                                             │ rolls up weekly
   ┌────────┐  raised_by   ┌──────────────┐            ┌────▼────────┐
   │ User   │──────────────│   Concern    │            │weekly_review│ L3+L4
   └────────┘              │  (+events)   │            └─────────────┘
                           └──────────────┘
   GitHub/Discord/Calendar activity ──linked to──▶ Team / User / Milestone
   Every mutation ──writes──▶ audit_logs
```

**Cardinality highlights:** Domain 1—* Team; Team 1—* TeamMember *—1 User (a User can be in many teams via roles); Project 1—* Milestone 1—* Task; Mentee 1—* MenteeUpdate; one (Mentee,Week) → one WeeklyReview spanning L3 (mentor) + L4 (teacher); Concern 1—* ConcernEvent.

---

## 11. User Flows

### 11.1 Admin: provision a user
`Admin → Users → Create/Import → enter email,role,domain,team → system creates user(Invited) + invitation email → user clicks activation link → sets password (must_change_password cleared) → status Active → lands on role dashboard.`

### 11.2 Mentee: 2-day update + blocker → concern
`Mentee dashboard → "Submit Update" → fills Worked On / Learning / Blocker / Next Goal → save (append-only) → if Blocker non-empty, offer "Raise as concern?" → if yes, prefilled Concern form (category=Technical) → submit → ticket created + email to LCC cc organizing team → mentee sees ticket in "My Concerns".`

### 11.3 Mentor: weekly review (L3)
`Saturday notification → Mentor → "Weekly Reviews" queue (one card per mentee, auto-flag pre-filled from rules) → write Progress Summary / Strength / Improvement Area → set Mentor Status → submit → row handed to Teacher's L4 queue.`

### 11.4 Teacher: L4 review + faculty gate
`Sunday notification → Teacher → L4 queue (mentor L3 visible) → set Teacher Decision + Notes → submit. Separately: Gates → Proposal review → verdict Approved/Revise/Rejected → if Revise, 24h (configurable) revision window opens for team → on Approved, next phase unlocks.`

### 11.5 LCC: resolve a concern
`LCC → Concern Queue (sorted by SLA) → open ticket → Acknowledge → assign/own → In Progress → (if needed) Escalate (notifies organizing team) → add resolution note → Resolved → reporter notified → auto-Close after window.`

### 11.6 LCC/Admin: bulk email
`Email Center → Compose → subject + rich body + attachments → select recipients by Domain/Team/Role/individuals → Send now or Schedule → delivery status tracked per recipient.`

### 11.7 System (automated): missed deadline
`Scheduler evaluates escalation_rules → finds deliverable overdue / no update ≥ threshold → sets flag (🟡/🔴) → sends notification to Student + Mentor + Team Lead, CC relevant members per notification_rules → logs event → surfaces on dashboards.`

---

## 12. Wireframe Descriptions

Text descriptions of primary screens (layout intent, not pixel design).

- **Login / First-run.** Centered card: email + password, "forgot password." First login intercepts with a forced "set new password" screen. No signup link anywhere.
- **Mentee Dashboard.** Top: identity strip (mentor, teacher, team, domain, squad). Left column: "Next up" (upcoming deadlines, pending update CTA, pending weekly review). Center: tabs — *Milestones/Phases*, *Tasks*, *Submissions/Deliverables*, *Feedback*. Right rail: activity (GitHub commits, Discord, calendar). Persistent "Submit Update" and "Raise Concern" buttons.
- **Mentor Dashboard.** A **table of mentees** (the L2 dashboard): columns Updates-This-Week, Last Update, Blocker Streak, Status (colour chip 🟢🟡🔴), Days Since Update, L2 Comment, Action Needed. Row click → mentee detail (update history, projects, GitHub/Discord, feedback). Tabs: *My Mentees*, *Weekly Reviews (L3)*, *Tasks*, *Reviews/Calendar*, *Announcements*.
- **Team Lead Console.** Kanban of issues/PRs synced from GitHub (`Backlog/In Progress/In Review/Done/Released`); blocker panel with SLA timers; "Generate weekly summary" button.
- **Teacher Dashboard.** Domain selector (if multiple). Top metrics: teams on-track/at-risk, pending gates, L4 queue count. Center: *Groups* grid (each card shows mentor, milestone %, flags), *L4 Review Queue*, *Gates*, *Mentor Performance*, *Reports*.
- **LCC Console.** Global drive-health header (completion %, delayed deliverables, inactive teams, open concerns/escalations). Tabs: *Domains Overview* (comparison), *Concern Queue*, *Email Center*, *Onboarding Tracker*, *Demerits*, *Events/Hackathons*.
- **Admin Console.** Tabs: *Users* (create/import/roles), *Org Structure* (domains/teams/assignments), *Drive Configuration* (phases, gates, review cycles, escalation thresholds, rubrics, deliverable types), *Email Templates*, *Integrations*, *Audit Logs*.
- **Concern Detail.** Header (category, severity, status chip, SLA countdown). Timeline of events. Resolution box. Linked entity (student/team/milestone). CC list.
- **Analytics screens.** Card grid of KPIs + drill-down charts (trend lines, comparisons) per §18, scoped by role.

---

## 13. API Specifications

RESTful JSON over HTTPS; `Authorization: Bearer <jwt>`; all list endpoints support pagination, filtering, and scope enforcement. Representative (not exhaustive) endpoints:

### 13.1 Auth
```
POST   /auth/login                 {email,password} → {token, must_change_password}
POST   /auth/first-login           {token, new_password}
POST   /auth/forgot-password       {email}
POST   /auth/reset-password        {token, new_password}
POST   /auth/logout
GET    /auth/me                     → user + roles + scopes
```

### 13.2 Users & org (Admin/LCC)
```
POST   /users                      create single
POST   /users/import               bulk CSV
PATCH  /users/{id}                  edit/suspend/deactivate
POST   /users/{id}/reset-password
GET    /domains | POST /domains | PATCH /domains/{id}
GET    /teams   | POST /teams   | PATCH /teams/{id}
POST   /teams/{id}/members
```

### 13.3 Reviews & updates
```
POST   /mentee-updates             L1 submit
GET    /mentees/{id}/updates
GET    /mentors/{id}/dashboard     L2 table (auto-computed)
POST   /mentor-status              L2 submit
GET    /weekly-reviews?week=&scope=  L3/L4 queue
POST   /weekly-reviews             L3 submit (mentor)
PATCH  /weekly-reviews/{id}/l4     L4 submit (teacher)
POST   /mentor-feedback            360°
```

### 13.4 Projects / milestones / tasks / deliverables / gates
```
GET/POST/PATCH /projects
GET/POST/PATCH /milestones        (+ /{id}/signoff)
GET/POST/PATCH /tasks
POST   /deliverables               submit
PATCH  /deliverables/{id}/review   approve/reject
POST   /gates/{id}/verdict         faculty gate decision
POST   /evaluations                rubric scoring
```

### 13.5 Concerns
```
POST   /concerns                   raise (triggers email + ticket)
GET    /concerns?status=&scope=
PATCH  /concerns/{id}/transition   {to_status, note}  (logs concern_event)
POST   /concerns/{id}/assign
```

### 13.6 Communications & notifications
```
POST   /emails                     compose/send/schedule
GET    /emails/{id}/status
GET/POST/PATCH /email-templates
POST   /announcements
GET    /notifications | PATCH /notifications/{id}/read
GET/POST/PATCH /notification-rules
GET/POST/PATCH /escalation-rules
```

### 13.7 Integrations & analytics
```
POST   /integrations/{provider}/connect
POST   /integrations/{provider}/sync
GET    /github/activity?team=
GET    /discord/activity?team=
GET    /calendar/events?scope=
GET    /analytics/{scope}/{metricset}   role-scoped KPI payloads
GET    /reports/{type}?format=csv|xlsx|pdf
GET    /audit-logs?entity=&actor=        (Admin)
```

**Webhooks (inbound):** `POST /webhooks/github`, `POST /webhooks/discord` — signature-verified, queued for async processing.

---

## 14. Integration Architecture

All integrations follow a common pattern: **OAuth/app credentials stored encrypted → scheduled pull syncs + inbound webhooks → normalized into `*_activity` tables → surfaced in dashboards & analytics → degrade gracefully when unavailable.**

### 14.1 GitHub
- **Auth:** GitHub App (preferred) or org OAuth; per-team repo mapping (`teams.github_repo_url`).
- **Tracked:** commits, pull requests, issues, reviews, branch activity, repository contribution, milestone completion.
- **Mechanism:** webhooks (`push`, `pull_request`, `issues`, `pull_request_review`, `milestone`) for real-time; nightly reconciliation pull for completeness.
- **Mapping:** GitHub usernames ↔ `users.github_username`; PR/issue state mapped to platform task/milestone status where linked (`Closes #N`).
- **Used by:** Team Lead console, GitHub analytics (commits/PRs/docs → 25% top-team weight), inactivity flags.
- **Degradation:** if unavailable, dashboards show "last synced" timestamp; manual progress entry still works.

### 14.2 Discord
- **Auth:** Discord bot with guild scope; per-team channel mapping (`teams.discord_channel_id`).
- **Tracked:** participation (messages/reactions), announcements, team-channel activity, joins (onboarding).
- **Mechanism:** bot gateway events + REST; onboarding check (who has joined / submitted username); optional outbound announcement posting.
- **Used by:** onboarding tracker (LCC), engagement analytics (20% top-team weight), inactivity flags, announcement fan-out.

### 14.3 Google Calendar
- **Auth:** Google OAuth (service account or per-organizer).
- **Tracked / synced:** mentor meetings, review meetings, deadlines, milestones, events (hackathons, peer interviews, presentations).
- **Mechanism:** two-way where feasible — platform creates events (review meetings, deadlines) and reads attendee responses; milestone due dates pushed as calendar entries.
- **Used by:** all dashboards' calendar rail, review scheduling, deadline notifications.

---

## 15. Email Architecture

A built-in **Email Center** (Admin/LCC; scoped for Teacher/Mentor) plus a **transactional/automated** pipeline.

```
                 ┌──────────────────────────────────────────────┐
                 │              Email Center (UI)               │
                 │ compose · subject · rich body · attachments  │
                 │ recipients: domain/team/role/individuals     │
                 │ send now │ schedule                          │
                 └───────────────────┬──────────────────────────┘
                                     ▼
   automated triggers ─────▶  ┌──────────────┐   templates(+variables)
   (notification_rules) ────▶ │ Email Service │◀─── email_templates
   concern raised ──────────▶ │  (queue +     │
   password/invite ────────▶  │  retry +      │──▶ ESP (SMTP/API) ──▶ recipients
                              │  status log)  │
                              └──────┬────────┘
                                     ▼
                            emails / delivery status
```

**Capabilities:** compose with rich-text + attachments; recipient targeting by **domain / team / mentor / mentee / role / individuals**; **send immediately or schedule**; template library with variable substitution (e.g., `{{mentee_name}}`, `{{deadline}}`); per-recipient delivery status; bounce/failure handling with retry; full audit. **Concern routing** is a first-class template: To=LCC, CC=organizing-team contacts (configurable), subject/body auto-generated from the ticket.

**Provider abstraction:** an `EmailService` interface backs any ESP (SES/SendGrid/SMTP); switching providers is configuration, not code.

---

## 16. Notification Matrix

All triggers are **rule-driven** (`notification_rules` + `escalation_rules`) and configurable. Default audiences below. Channels: **In-app**, **Email**, **Discord** (where mapped).

| # | Trigger | Default audience | CC | Channels | Default rule param |
|---|---|---|---|---|---|
| 1 | **Upcoming deadline** | Student, Mentor | — | In-app, Email | T-48h (config) |
| 2 | **Missed deadline** | **Student, Mentor, Team Lead** | relevant members | In-app, Email | At due+0 |
| 3 | **New task assigned** | Assignee | Mentor | In-app, Email | On assign |
| 4 | **Deliverable due** | Owner | Mentor | In-app, Email | T-24h |
| 5 | **Deliverable overdue** | **Student, Mentor, Team Lead** | Teacher | In-app, Email | due+0 |
| 6 | **Milestone completed** | Team, Mentor, Teacher | LCC | In-app | On sign-off |
| 7 | **Review scheduled** | Attendees | — | In-app, Email, Calendar | On create |
| 8 | **Review missed** | Mentor, Teacher | LCC | In-app, Email | After window |
| 9 | **Weekly update pending** | Student | Mentor | In-app, Email | Per cadence |
| 10 | **Mentor feedback added** | Mentee | — | In-app | On submit |
| 11 | **Team inactive** | Mentor, Team Lead, Teacher | LCC | In-app, Email | No activity ≥ threshold |
| 12 | **GitHub inactivity** | Student, Mentor | Team Lead | In-app, Email | No commits ≥ threshold |
| 13 | **Discord inactivity** | Student, Mentor | LCC | In-app | No activity ≥ threshold |
| + | **Inactivity flags** (🟡/🔴) | Mentor | Teacher (on 🔴) | In-app | 3d→🟡, 5d→🔴 (config) |
| + | **Mentor not reviewing** | Teacher | LCC | In-app, Email | No feedback ≥ 1 wk |
| + | **Blocker stale** | Faculty/Teacher | LCC | In-app, Email | Unresolved ≥ 3d |
| + | **Concern raised / SLA breach** | LCC | organizing team | Email, In-app | On raise / SLA due |

> **Missed-task rule (explicit per mandate):** when a task/deliverable is missed, email **Student + Mentor + Team Lead**, with all relevant members in **CC**.

---

## 17. Reporting Architecture

- **Report types:** Student progress report, Mentor activity report, Team/Group report, Domain health report, Drive summary, Concern/SLA report, Evaluation/Top-team report, Attendance report, Tracking-sheet export (mirrors original Mentee Updates / Mentor Dashboard / Weekly Reviews tabs).
- **Generation:** on-demand and scheduled; parameterized by scope (role-enforced) and date range.
- **Formats:** **CSV, XLSX, PDF**.
- **Continuity:** XLSX export reproduces the legacy three-tab workbook so existing consumers transition smoothly.
- **Architecture:** reporting reads from **pre-aggregated rollup tables** (refreshed on a schedule + on key events), not live transactional queries, to keep generation fast and non-disruptive.
- **Delivery:** download, email attachment, or scheduled email to a distribution list.

---

## 18. Analytics Architecture

Pre-computed rollups feed role-scoped dashboards. Each metric drills down to source records (RBAC-enforced).

### 18.1 Student analytics
Completion % · task completion · attendance · GitHub contribution · review score · update consistency (updates/week) · blocker resolution rate · skill growth (Phase 1→current).

### 18.2 Mentor analytics
Team performance (aggregate mentee status) · review completion (L2/L3 on-time %) · student success (outcomes) · 360° feedback score (availability/usefulness) · responsiveness.

### 18.3 Teacher analytics
Domain health · mentor performance comparison · milestone/gate completion · at-risk student count · deliverable approval rate.

### 18.4 LCC analytics
**Entire drive health** · domain comparison · completion rates · delayed deliverables · inactive teams · concern volume & SLA adherence · onboarding completion · engagement (Discord/GitHub) trends.

### 18.5 Pipeline
```
transactional tables ──(scheduled + event-driven ETL)──▶ rollup/aggregate tables
github_activity ─┐
discord_activity ┼──▶ activity rollups ──▶ analytics API ──▶ role-scoped dashboards
mentee_updates ──┘                                   └──▶ rubric inputs (top-team selection)
```

> The **top-team rubric** (e.g., 35% project / 25% GitHub / 20% Discord+logs / 15% skill growth / 5% peer review) is computed directly from these analytics + evaluations, with weights configurable.

---

## 19. Security Architecture

- **AuthN:** credential login (Admin-provisioned), forced first-login password change, email-token password reset, optional TOTP MFA, secure session/JWT with rotation and revocation.
- **AuthZ:** server-side RBAC (§6) on every request — role **and** scope (domain/team/self). Default-deny; least privilege.
- **No public registration:** invitation-only; activation tokens single-use and expiring.
- **Secrets:** integration credentials encrypted at rest (KMS-backed); never exposed to clients.
- **Transport/storage:** TLS 1.2+ in transit; encryption at rest for DB and attachments; signed, time-limited URLs for file access.
- **Input safety:** validation, output encoding, parameterized queries, rich-text sanitization (email/announcement bodies), file-type/size limits + AV scanning for attachments.
- **Webhook security:** signature verification (GitHub/Discord), replay protection.
- **Audit:** immutable `audit_logs` for every privileged/mutating action (actor, before/after, IP, time); concern timeline; append-only update history.
- **Privacy:** PII access gated by RBAC; anonymous-concern option; configurable retention; right-to-export.
- **Rate limiting & abuse protection:** per-IP/user throttling on auth and write endpoints; lockout/backoff on failed logins.
- **Environment isolation:** separate dev/staging/prod; no production secrets in lower environments.

---

## 20. Deployment Architecture

```
            ┌──────────┐     ┌──────────────┐     ┌───────────────┐
  Users ───▶│   CDN /   │────▶│  Web App      │────▶│  API services │
            │  WAF/TLS  │     │ (Next.js SSR) │     │ (REST + auth) │
            └──────────┘     └──────────────┘     └──────┬────────┘
                                                          │
              ┌──────────────────────┬────────────────────┼───────────────┐
              ▼                      ▼                     ▼               ▼
        ┌───────────┐        ┌──────────────┐      ┌────────────┐   ┌──────────┐
        │PostgreSQL │        │ Redis (cache │      │ Job/Queue   │   │ Object   │
        │(primary +  │        │ + sessions)  │      │ workers     │   │ storage  │
        │ read repl) │        └──────────────┘      │(scheduler,  │   │(attach.) │
        └───────────┘                               │ syncs,      │   └──────────┘
                                                    │ notifs)     │
                                                    └─────┬───────┘
                              ┌──────────────────────────┼───────────────────────┐
                              ▼                          ▼                        ▼
                        GitHub API/webhooks       Discord bot/gateway      Google Calendar API
                              │                                                   
                              ▼  outbound email
                        ESP (SES/SendGrid/SMTP)
```

- **Frontend:** Next.js app (the existing `client/`), SSR + client components, responsive.
- **Backend:** stateless API services behind a load balancer; horizontally scalable.
- **Async tier:** queue + workers for scheduled jobs (escalation evaluation, notifications, integration syncs, report/rollup generation) — keeps request path fast.
- **Data:** PostgreSQL (primary + read replicas), Redis (cache/sessions/rate-limit), object storage for attachments/deliverables.
- **Delivery:** containerized services; CI/CD; blue-green/rolling deploys; per-environment config and secrets via a secrets manager.
- **Observability:** centralized logs, metrics, traces, integration-sync health, alerting.

---

## 21. Scalability Considerations

- **Stateless API + horizontal scale:** sessions in Redis, no node affinity.
- **Read/write separation:** analytics & reports hit read replicas / rollups, never the write path.
- **Pre-aggregation:** dashboards and rubric computation read materialized rollups refreshed on schedule + events — O(1) at view time regardless of update volume.
- **Async everything external:** GitHub/Discord/Calendar syncs and all notifications/emails are queued, retried, idempotent — spikes (e.g., hackathon weekend commit bursts) absorbed by workers.
- **Tenant/drive partitioning:** data scoped by `drive_id`/`domain_id`; supports multiple concurrent drives and clean archival of past drives.
- **Pagination & virtualization** on all large lists (mentee tables, activity feeds, concern queues).
- **Webhook backpressure:** inbound webhooks accepted fast, processed async; reconciliation pulls cover any missed events.
- **Headroom:** corpus scale is ~3–6 domains × ~18 teams × ~5 mentees ≈ low hundreds of users; architecture targets 10×+ (thousands of users, multiple drives) without redesign.

---

## 22. Complete Product Roadmap (Capability Tiers)

> Per the timeless-spec mandate, the "roadmap" is expressed as **capability tiers (scope layers)** — what is foundational vs. additive — **not** a calendar. Tiers may be delivered in any order/cadence the delivery team chooses.

```
TIER 1 (MVP) ──────────▶ TIER 2 ──────────────▶ TIER 3
Core accountability       Automation & integration   Intelligence & scale
loop + RBAC + concerns    + email/notifications +     + advanced analytics +
                          GitHub/Discord/Calendar     showcase + multi-drive
```

---

## 23. Capability Tier 1 — MVP Scope

The minimum that replaces the spreadsheets and delivers the core accountability loop.

- **Auth & user lifecycle** (FR-1.*): admin-provisioned users, invitation, forced first-login password change, reset. **No public signup.**
- **RBAC** (§6) with all six roles and scope enforcement.
- **Org structure** (FR-2.*): domains, teams, assignments, squads.
- **L1–L4 review engine** (FR-3.* / 4.* / 6.*): mentee updates, mentor L2 dashboard + status, mentor L3 weekly review, teacher L4 review — with the exact tracking-sheet fields and status enums.
- **Auto-flags** (🟡/🔴, repeated blocker, consistency gap) via scheduled jobs.
- **Concern management** (FR-8.*): raise → ticket → email to LCC cc organizing team → lifecycle → resolve.
- **Projects/milestones/tasks/deliverables** (FR-9.*) incl. skill tracker; **faculty gates** (FR-10.1).
- **Role dashboards** (Mentee/Mentor/Teacher/LCC/Admin) per §12.
- **Basic in-app notifications** for the core triggers (updates pending, missed deadline, feedback added).
- **Audit logging** (FR-13.2) and **tracking-sheet CSV/XLSX export** (FR-13.3).
- **Drive configuration** for phases, milestones, review cadences, and thresholds (so MVP is already not hardcoded).

---

## 24. Capability Tier 2 Scope

Automation and external truth.

- **Email Center** (§15): compose, attachments, recipient targeting, send/schedule, templates.
- **Full automated notification matrix** (§16) across in-app + email, with configurable rules and the explicit missed-task routing (Student+Mentor+Team Lead, CC members).
- **GitHub integration** (§14.1): activity sync, Team Lead console, GitHub analytics, inactivity flags.
- **Discord integration** (§14.2): onboarding tracker, participation analytics, inactivity flags, announcement fan-out.
- **Google Calendar integration** (§14.3): review scheduling, deadlines, milestones, events.
- **360° mentor feedback** (FR-3.4) and **mentor-performance analytics**.
- **Weighted rubric engine + top-team selection** (FR-10.2/10.3).
- **Demerit & accountability** (FR-7.5); **reporting suite** (§17) in CSV/XLSX/PDF.
- **Escalation-rule engine** fully configurable (SDSE-style SLAs, blocker-stale, mentor-not-reviewing).

---

## 25. Capability Tier 3 Scope

Intelligence, breadth, and scale.

- **Advanced analytics** (§18): trend lines, domain comparison, predictive at-risk detection, cohort benchmarking.
- **Public Showcase** surfaces (Phase 4): project galleries, portfolio links, external-audience pages.
- **Multi-drive / multi-cohort**: run and compare multiple drives; archive past drives; cross-drive alumni view.
- **Deeper GitHub** signals (commit quality, PR review latency, contribution distribution) and **two-way Discord/Calendar** automation.
- **Mobile app / PWA** enhancements; **localization** (multi-language).
- **Hackathon & peer-interview modules** (judging, leaderboards, scheduling) as first-class features.
- **Configurable workflow designer** (visual editor for phases/gates/escalations) and **rubric A/B comparison**.
- **Webhooks/API for third parties** and SSO (Google/Microsoft) options.

---

## 26. Configurability Model (Dynamic Drive Structure)

This section formalizes the mandate that **all structure is admin/LCC-managed, never hardcoded**.

| Configurable entity | What Admin/LCC controls | Backed by |
|---|---|---|
| **Domains** | Add/edit; governance profile (team model, branch policy, default rubric, deliverable types, display aliases) | `domains` |
| **Teams** | Alias type (Pod/Group/Team/Squad), size, mentor/teacher/lead, repo/channel | `teams`, `team_members` |
| **Phases** | Name, sequence, theme, (optional) duration label | `phases` |
| **Gates** | Where they sit, verdict options, whether they block progression | `gates` |
| **Milestones / Deliverables** | Per domain/project; acceptance criteria, defense questions, deliverable types | `milestones`, `deliverable_types` |
| **Review cycles** | Level (L1–L4), owner role, **cadence rule**, field schema, status enums | `review_cycles` |
| **Deadlines** | Set/adjusted on milestones/tasks/deliverables | entity due dates |
| **Escalation thresholds** | 3/5/7-day flags, repeated-blocker count, consistency-gap count, blocker-stale, PR-stalled SLAs | `escalation_rules` |
| **Rubrics & weights** | Dimensions and weights (35/25/20/15/5 or equal-weight) | `rubrics`, `rubric_dimensions` |
| **Email templates & notification rules** | Subjects, bodies, audiences, CC, channels | `email_templates`, `notification_rules` |
| **Concern categories & SLAs** | Category list, severity SLAs, CC routing | `concerns` config |

> **Design rule:** any value that differs between the source documents (see analysis §9 conflicts) is exposed here as configuration with a sensible default — so the platform runs the 4-phase/8-week model *or* the 2-phase/5-week model, the AI Pod *or* the SDSE engineering team, with no code change.

---

## 27. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Low update compliance** (mentees don't post L1) | High | High | Make update flow ≤2–3 min; pending-update nudges; mentor/teacher visibility of gaps; demerit policy |
| R2 | **Integration fragility** (GitHub/Discord/Calendar API limits, auth expiry) | Med | Med | Queued+retried syncs; reconciliation pulls; graceful degradation; "last synced" transparency |
| R3 | **Notification fatigue / spam** | Med | Med | Configurable rules; digest options; per-user channel prefs; sensible defaults |
| R4 | **RBAC/scope leakage** (cross-domain data exposure) | Low | High | Server-side scope checks on every endpoint; automated authorization tests; audit logs |
| R5 | **Config complexity** (admins misconfigure phases/thresholds) | Med | Med | Guided config UI, validation, safe defaults, preview, change audit |
| R6 | **Terminology mismatch across domains confuses users** | Med | Low | Canonical entities + per-domain display aliases (analysis §8) |
| R7 | **Source-document contradictions** (thresholds, phase models) | High | Med | Resolved via configuration (§26), not hardcoded assumptions |
| R8 | **Email deliverability** (concern routing critical) | Med | High | Reputable ESP, SPF/DKIM/DMARC, delivery-status tracking, retry, in-app fallback |
| R9 | **Data migration from legacy sheets** | Med | Med | CSV importers mirroring the three tabs; export parity for rollback confidence |
| R10 | **Adoption resistance** (staff prefer spreadsheets) | Med | High | Export parity, lower-effort-than-sheets UX, phased rollout per domain |
| R11 | **Scale spikes** (hackathon weekends) | Low | Med | Async workers, webhook backpressure, pre-aggregation (§21) |
| R12 | **Privacy of concerns/feedback** | Med | High | Anonymous option, strict RBAC, restricted concern visibility |

---

## 28. Success Metrics

### 28.1 Platform adoption & operational health
- ≥ 90% of mentees submit L1 updates per configured cadence.
- ≥ 90% on-time L2/L3/L4 review completion.
- 100% of concerns ticketed (zero off-platform escalations) with median resolution within SLA.
- ≥ 80% of integration syncs healthy at any time; <1% webhook loss after reconciliation.
- Tracking-sheet export parity validated (legacy consumers fully served).

### 28.2 Drive outcomes (mirroring the program's own metrics)
| Source metric | Platform measure |
|---|---|
| **Student:** weekly updates completed, milestones achieved, blockers resolved in time | Update consistency %, milestone completion %, blocker resolution SLA % |
| **Mentor:** regular feedback, tasks tracked, engagement | L2/L3 completion %, tasks assigned/closed, 360° score |
| **Faculty:** visibility, fast blocker resolution, early risk ID | % groups visible (100%), blocker time-to-resolve, # at-risk caught before red flag |
| **LCC:** drive health, accountability | Domain completion rates, inactive-team count, escalation SLA adherence |

### 28.3 North-star
**Time-to-awareness of a problem** (a stale blocker, an inactive team, a missing review) drops from *days of manual auditing* to **automatic, same-day surfacing** — and every raised concern reaches resolution with a tracked, auditable trail.

---

*End of PRD. Companion analysis: [01_RawDocs_Analysis_Report.md](01_RawDocs_Analysis_Report.md).*
