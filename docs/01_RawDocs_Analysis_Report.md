# Raw Documentation Analysis Report
## Source Discovery for the Profile Building Drive Management Platform

> **Purpose of this report.** Before any platform requirements are written, this document captures a complete, evidence-based analysis of every artifact inside `raw_docs/`. It extracts the operating model of the **Summer Profile Building Drive (SPBD) 2026** — its roles, hierarchy, phases, review cadences, tracking fields, status enums, escalation rules, evaluation criteria, and per-domain governance — so that the platform PRD ([02_Platform_PRD.md](02_Platform_PRD.md)) is grounded in what the organization actually does today, not invented from scratch.
>
> **Important framing.** The drive documents describe an **8-week (or 5-week) calendar-bound program**. This report records those phases, weeks, and gates *as evidence of structure*. The platform itself, per the project mandate, must treat all of these as **configurable, admin-managed entities** — never hardcoded timelines. Where the source documents contradict each other (and they do, in several places), those conflicts are flagged explicitly so the platform can be designed to absorb either interpretation.

---

## 1. Corpus Inventory

| Group | Artifacts analyzed | Nature |
|---|---|---|
| **Profile Building Drive (core)** | `Product Requirements Document (PRD).md`, `Planning Profile Building Drive.md`, `MOM_Planning Profile Building Drive.md`, `Profile Building Drive 2026.pdf` | Authoritative drive governance, phases, roles, LCC responsibilities, escalation rules |
| **Tracking sheets** | `SPBD2026_Tracking_Sheet.xlsx` → `Mentor Dashboard`, `Mentee Updates`, `Weekly Reviews` (CSV exports) | The **live operating system** of the drive — the single richest source of fields, statuses, flags, cadences |
| **ML domain** | `MACHINE LEARNING SUMMER PROJECT HANDBOOK.md`, `ML_Domain_Structure.md` | ML track operating model + 8 project tracks |
| **SDSE domain** | `DevClub_Engineering_Handbook_v2.md` + 5 example PRDs (`AsyncNodes`, `FrameLabs`, `QuillSync`, `Shipyard`, `StreamLine`) | Software engineering standards, team model, review cycles, evaluation |
| **AI domain** | 6 repos (`engageiq-ai`, `examlens-ai`, `hireflow-ai`, `newssnap-ai`, `reporag-ai_1`, `slmforge`) — governance docs only (README, MILESTONES, POD_GUIDE, CONTRIBUTING, DEVELOPMENT_GUIDE, ISSUES_TRACKER, GITHUB_ISSUES, `.github/` templates, `ci.yml`) | "Pod" team model, milestone/issue/label scheme, GitHub workflow, Q&A accountability |

> The AI repos' actual source code (`.py` files, React components) was treated as out of scope — it describes *what students build*, not *how the drive is governed*. Only governance/process documentation was mined.

The destination codebase (`client/`) is a **fresh Next.js scaffold** — there is no prior platform implementation to reconcile against. This is a greenfield build.

---

## 2. The Drive at a Glance (Synthesized Operating Model)

The SPBD is a mentor-driven, cohort-based program that turns an idle summer into a portfolio-building sprint. It is organized as a **four-level hierarchy of people** working across **multiple domains**, coordinated through **Discord**, with progress captured in a **shared tracking workbook** and surfaced through a **layered review cadence (L1–L4)**.

```
                         ┌─────────────────────────────┐
                         │   LCC  (coordination layer)  │
                         │  + Organizing Team escalation│
                         │   (Nipun Sir, Kushagra Sir)  │
                         └──────────────┬──────────────┘
                                        │ monitors all domains
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                                ▼
   DOMAIN: AI                      DOMAIN: ML                      DOMAIN: SDSE  ... (configurable)
   Teacher/Faculty                 Teacher/Faculty                 Teacher/Faculty
        │                               │                                │
   ┌────┴────┐                     ┌────┴────┐                      ┌─────┴─────┐
   ▼         ▼                     ▼         ▼                      ▼           ▼
 Group 1 … Group 18            Group/Squad …                  Team …         Team …
 (Student Mentor +            (Student Mentor +              (Mentor + Team Lead +
  ~5 Mentees)                  Mentees)                      Juniors + Mentees)
```

**Key structural facts (consistent across sources):**

- A **Domain** (AI, ML, SDSE, and others) is owned by one or more **Teachers/Faculty Mentors**.
- A Domain contains many **Groups / Teams / Squads / Pods** (terminology varies by domain — see §8).
- Each Group has **one Student Mentor** and **~5 Mentees** (PRD.md example: "AI Group 07" with mentor Aryan Sharma and 5 mentees).
- **Two project tracks run in parallel:** a **Group Project** (shared) and an **Individual Project** (per student).
- **Discord is the communication backbone**; **GitHub is the work/paper trail**; a **tracking sheet is the accountability ledger**.
- **LCC** is the cross-domain coordination and escalation committee; the **Organizing Team** (named individuals **Nipun Sir** and **Kushagra Sir**) is the final escalation tier.

---

## 3. Roles & Responsibilities (Consolidated)

The platform implements **five roles**: **Admin, LCC, Teacher, Mentor, Mentee**. Below is each role as evidenced in the source documents, with terminology reconciled.

> **Platform decision — Mentor = Team Lead.** In the Profile Building Drive itself, each group has a single **Student Mentor** who *leads* the team (PRD.md, the PDF, and ML's "Group leaders and mentors"). The separate "Team Lead" role only appears in the SDSE DevClub *engineering* handbook (a reference program). The platform therefore **merges Team Lead into Mentor**: the Student Mentor both manages mentees (L2/L3) and owns team delivery (board/issues/PRs, blockers, team deliverables). The "Team Lead" row below is retained only to document the source material.

| Platform Role | Source terms | Core responsibilities (evidenced) |
|---|---|---|
| **Admin** | (implied — system owner) | Full system access; user/team/domain provisioning; email center; analytics; audit logs; system configuration of phases/milestones/cadences |
| **LCC** | "Learner Career Council" (PRD.md) / "Leadership & Coordination Committee" (PDF) — *terminology conflict, both = LCC* | Discord onboarding & community mgmt; mentor/mentee tracking; evaluation management; faculty coordination; team coordination; hackathon planning; **demerit & accountability management**; **issue resolution (first point of contact)**; engagement activities; reporting & operational oversight |
| **Teacher** | "Faculty", "Faculty Mentor" | Owns a domain; reviews all groups under them; weekly review meetings; reviews proposals (faculty gate); milestone sign-off; final panel scoring; **L4 weekly review (Teacher Decision + Notes, Sundays)**; escalate to LCC |
| **Mentor** | "Student Mentor" (2nd-year student) | Skill assessment (Phase 1); assign tasks & resources; break project into milestones; **L2 status updates every 2 days**; **L3 weekly review (Sat: Progress Summary, Strength, Improvement Area, Mentor Status)**; resolve blockers; provide feedback |
| ~~**Team Lead**~~ → **merged into Mentor** | DevClub "Team Lead" (2–3 per SDSE team); AI "Maintainer (Student Leader)" | Engineering/delivery ownership; breaks PRD into issues; assigns work; reviews PRs; runs standup; prepares weekly summary; **first escalation point**; sign-off on promotions. *(Source: most formalized in SDSE; AI's "Maintainer" is the analog; absent in ML. **In the platform these duties belong to the Mentor** — see the decision note above.)* |
| **Mentee** | "Student", "Participant", "Contributor", "Junior Developer" | **L1 updates every 2 days** (5 fields); complete assigned tasks/exercises; build group + individual projects; submit deliverables; participate in hackathons/presentations/peer interviews; raise blockers/concerns |

**Organizing Team (above LCC):** Named individuals **Nipun Sir** and **Kushagra Sir** are the CC/escalation recipients for concerns — modeled in the platform as a configurable "escalation contact" group, not a login role per se (though they may also hold Admin/LCC accounts).

---

## 4. The Review Cadence — L1 → L4 (The Platform's Core Workflow Engine)

The three tracking sheets reveal a **four-level review pipeline** that is the most important structural discovery in the entire corpus. This is the heartbeat the platform must reproduce as a workflow state machine.

| Level | Owner | Cadence | Artifact (sheet) | Fields captured |
|---|---|---|---|---|
| **L1 — Mentee Update** | Mentee | **Every 2 days** (~2–3 min) | `Mentee Updates` (append-only log) | Date, Mentee Name, Domain, Squad, **Worked On**, **Learning**, **Blocker**, **Next Goal** |
| **L2 — Mentor Status** | Mentor | **Every 2 days** | `Mentor Dashboard` (auto-summary per mentee) | Updates This Week, Last Update, Blocker Streak, **Status (L2)**, Days Since Update, **L2 Comment**, **Action Needed** |
| **L3 — Mentor Weekly Review** | Mentor | **Every Saturday** | `Weekly Reviews` cols A–J | Week #, Mentee, Domain, Squad, Mentor, **Progress Summary**, **Strength**, **Improvement Area**, **Auto Flag**, **Mentor Status** |
| **L4 — Teacher Weekly Review** | Teacher | **Every Sunday** | `Weekly Reviews` cols K–L | **Teacher Decision**, **Teacher Notes** |

### 4.1 Status enums (verbatim from sheets)

- **L2 Mentee Status:** `Doing Well` · `Needs Consistency` · `No Updates 4+ Days`
- **L2 colour coding:** 🟢 On Track · 🟡 Needs Consistency · 🔴 No Updates 4+ Days
- **L3 Mentor Status:** `On Track` · `At Risk` · `Needs Discussion`
- **L4 Teacher Decision:** `Continue` · `Monitor` · `Schedule Discussion`

### 4.2 Auto-flag rules (the automation seed)

The "mentor bot" already auto-generates these flags — the platform must internalize them as scheduled jobs:

| Flag | Trigger (verbatim) |
|---|---|
| 🔴 **No Updates** | "No updates 7+ days" (Weekly Reviews) — note legend on Mentor Dashboard says **4+ days**; *cadence conflict, see §9* |
| **Repeated Blocker** | "same blocker 3+ updates" |
| **Consistency Gap** | "<3 updates in a week" |

### 4.3 Escalation thresholds (from PRD.md §8)

| Level | Condition | Action |
|---|---|---|
| Student | No update for 3 days | 🟡 Yellow Flag |
| Student | No update for 5 days | 🔴 Red Flag |
| Mentor | No mentor feedback for 1 week | Escalate to Faculty/Teacher |
| Faculty | Blocker unresolved for 3 days | Escalate to LCC |

> **Synthesis:** L1/L2 are the 2-day pulse; L3/L4 are the weekly evaluation archive (Mentor Saturday → Teacher Sunday); auto-flags + escalation thresholds are the automated notification/escalation layer. All thresholds (3/5/7 days, "3+ updates", "<3/week", "1 week") must be **admin-configurable rule parameters**, not constants.

---

## 5. The Group Tracking Model (PRD.md Sections A–G)

The original PRD.md defines a per-group "Group Sheet" with seven sections. These map directly to platform data domains:

| Section | Purpose | Key fields → platform entity |
|---|---|---|
| **A — Mentor Information** | Mentor performance | Mentor Name, Faculty Assigned, # Mentees, Last Update Date, Faculty Comments → `mentor_profile` |
| **B — Mentee Feedback on Mentor** | Mentor accountability (weekly, by mentees) | Date, Mentee, Was Mentor Available?, Was Feedback Useful?, Comments → `mentor_feedback` (360° review) |
| **C — Group Project Tracker** | Shared project | Date Assigned, Milestone, Task Description, Assigned By, Expected Completion, Status, Completion %, Comments → `group_project` + `task` + `milestone` |
| **D — Individual Project Tracker** | Per-student project | Student, Project Name, Task, Assigned/Due Date, Progress, Mentor Feedback, Next Action → `individual_project` + `task` |
| **E — Skill Development Tracker** | Skill growth (esp. weaker students) | Student, Skill, Starting Level, Current Level, Evidence → `skill_assessment` (feeds "skill growth 15%" evaluation weight) |
| **F — Blockers & Doubts Tracker** | "Most critical section" — direct mentor↔faculty collaboration | Date, Student, Blocker, **Severity**, Raised By, Assigned To, Faculty Response, Resolution Date, **Status** → `blocker` / `concern` |
| **G — Mentorship Log** | Audit of all interactions | Date, Mentor, Mentee, Discussion Summary, Action Items, Next Check-In → `mentorship_log` |

> Section **F** is explicitly the seed of the platform's **Concern Management System**, and Section **B** is the seed of the **mentor accountability / 360° feedback** feature.

---

## 6. Phases, Gates, Milestones & Deliverables (Evidence — to be configured, not hardcoded)

The corpus contains **two competing phase models**. The platform must support *either* via configuration.

### 6.1 Model A — 4-Phase / 8-Week (Planning Profile Building Drive.md)

| Phase | Duration | Theme | Ends with |
|---|---|---|---|
| Phase 1 | 1.5 wks | Explore & Discover | Career path locked (Career Interest Declaration) |
| Phase 2 | 3 days | Decide & Propose | Faculty-approved proposals (Gate 1) |
| Phase 3 | 4 wks | Build + Hackathon Sprints | Working product (Milestone 1 & 2; Gate 2) |
| Phase 4 | 2 wks | Evaluate & Showcase | Certificate + top teams (Gate 3) |

### 6.2 Model B — 2-Phase / 5-Week (Profile Building Drive 2026.pdf, ML_Domain_Structure.md)

| Phase | Duration | Theme |
|---|---|---|
| Phase 1 | 1 wk | Skill Development & Assessment |
| Phase 2 | 4 wks | Project Development (proposal → faculty review → build) |

### 6.3 Faculty Approval Gates (Model A)

- **Gate 1** — End of Phase 2: proposal approval (`Approved` / `Revise & Resubmit` (24h) / `Rejected`)
- **Gate 2** — End of Week 4: Milestone 1 sign-off (on-track confirmation)
- **Gate 3** — Week 7 Faculty Panel: final evaluation, scores recorded

### 6.4 Cross-cutting standing activities (both models)

Weekly faculty review meetings · Peer-to-peer interviews (1 in Phase 1, 2 in Phase 2) · Internal hackathons (bi-weekly) · Inter-group presentations · Community engagement (trivia, quizzes) · Mentor evaluations · Weekly activity logs.

### 6.5 Top-Team Selection Rubric (Model A — a configurable weighted scorecard)

| Dimension | Weight | Measured by |
|---|---|---|
| Project quality + faculty panel scores | **35%** | Faculty rubric |
| GitHub contributions (commits, PRs, docs) | **25%** | GitHub analytics |
| Discord engagement + weekly logs | **20%** | Coordinator review |
| Skill growth (Phase 1→4) | **15%** | Mentor assessment vs skill map |
| Peer review scores | **5%** | Aggregate peer feedback |

> **Platform implication:** evaluation is a **configurable weighted-rubric engine**. The 35/25/20/15/5 split, the L4 decision options, and the gate verdicts are all admin-editable templates.

---

## 7. Per-Domain Governance Deep-Dive

The three domains share the drive-level cadence (L1–L4, phases) but differ sharply in *engineering governance*. The platform must model these as **domain-scoped configuration profiles**.

### 7.1 AI Domain — the "Pod" model

- **Pod = 5 students** (1 **Maintainer**/Student Leader + 4 **Contributors**) + 1 non-student **Faculty (Product Manager/Admin)**.
- **GitHub permission mapping:** Faculty=`Admin`, Maintainer=`Maintain`, Contributor=`Write`.
- **Branch model:** `main` (faculty-only merge) ← `dev` (2 approvals) ← `feature/issue-N-name`.
- **Milestones:** `M1…MN`, **one per week**, sequential; each maps to a contiguous **issue-number range** and carries Key Output, Acceptance Criteria, **Defense Questions (~5)**, min test count. Status seen: `Todo`.
- **Issue labels:** milestone labels `m1…mN` + category labels (`infra, agent, frontend, cv, scraper, parsing, analytics, …`) + template labels (`bug, enhancement, milestone, good first issue, needs-review`).
- **Accountability ritual:** **Faculty Q&A every 2–3 days**; "If you cannot explain it, you do not own it." Daily async standup (yesterday/today/blockers). Min **2 approvals** to merge to `dev`.
- **Board columns:** `Todo | In Progress | In Review | Done`.
- **CI:** only 3/6 repos ship a real `ci.yml` (lint via `ruff`/`black` + `pytest`); advanced repos add ASCII-only and internal-data path guards.
- **Variations:** `reporag-ai_1` and `slmforge` are heavier (10 milestones, pre-commit, policy guards, API/architecture/runbook docs, explicit "ship gates").

### 7.2 ML Domain — single assigned project, mentor-broken milestones

- **2-phase model:** Phase 1 (1 wk) Skill Development & Assessment → Phase 2 (4 wks) Project Development.
- Every participant **independently builds the same assigned project** (no separate individual proposal in ML); mentors **break the project into weekly milestones**.
- **8 project tracks** in the handbook (Hybrid Temporal Forecaster, Anomaly Detection, Acoustic Classification, Multi-Modal Fusion, Document Clustering, Skin Cancer Detection, Handwritten Grading, Crop Yield).
- **7 standard final deliverables per project:** Source Code, Data Pipeline, Visualizations, Model Evaluation table, **Technical Report (PDF)**, **Presentation (10-slide deck)**, **Demo Video (3-min)**.
- **Milestone gates** at End of Weeks 2/4/6/8 (per handbook) — but Domain Structure compresses to 4 weeks.
- **Tracking sheet updated every 2 days** by both mentor and mentee; **weekly faculty review meetings**.
- **Gaps:** no grading rubric/weights, no tracking-sheet field schema, no escalation ladder, Discord not mentioned — the platform supplies these.

### 7.3 SDSE Domain — DevClub Engineering Handbook (most formalized)

- **Team composition:** **Mentor ×1** (2nd-yr) + **Team Lead ×2–3** + **Experienced Junior ×2–3** + **Junior Developer ×4–6**. Roles are **two-dimensional**: a seniority *tier* crossed with a *function* (Product Owner, Engineering Lead, Frontend, Backend, Infrastructure).
- **8-week program = two 4-week phases** with gates: Wk1–2 planning (Week-2 doc-approval gate) → Wk3–4 core dev → Wk5 staging promotion 1 → Wk6–7 extended dev → Wk8 production promotion.
- **4-tier branch pipeline = 3-stage Definition of Done:** `feature/* → development → staging → main`, gated as **Feature Done → Staging Done → Production Done**.
- **Sprint cadence:** daily async update · Monday weekly sync (mandatory) · weekly mentor meeting · **all PR reviews due Thursday EOD**.
- **Required planning docs:** `PRODUCT_BREAKDOWN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DECISIONS.md` (each role-owned, gated for approval).
- **Conventional commits** (`feat, fix, docs, refactor, test, chore, perf, ci`), Husky pre-commit hooks, PR template + 6-dimension review checklist.
- **Escalation SLAs (verbatim):** blocker → notify lead **within 4h**, escalate **>1 day**; PR stalled **>48h** (ping 24h → lead 48h → mentor 72h); broken branch fix/revert **within 30 min**; disagreement resolution **24h**; ≥1 PR review per member per week; **min 20 issues before Sprint 1**.
- **Evaluation:** 4 **equal-weight** dimensions — Product quality, Engineering quality, Collaboration quality, Reliability (criteria-based, no numeric scale).
- **Issue/PR status pipeline (Shipyard example):** `Backlog → Assigned → Development → Pull Request → Review → Merged → Released`.
- **RBAC example (Shipyard):** `Organisation Admin, Engineering Manager, Team Lead, Engineer, Product Manager` scoped across Organisations/Teams/Projects/Repositories/Analytics.
- The 5 PRDs share an **11-section skeleton** (Overview, Vision, Inspirations, Target Users, Outcome, Core Requirements, Scale, Constraints, Technical Expectations, Success Metrics, Deliverables) — useful as a **project-template** the platform can store.

---

## 8. Terminology Reconciliation (Critical for the Data Model)

The same concept is named differently across domains. The platform must adopt **canonical entities with domain-specific display aliases**.

| Canonical entity | AI term | ML term | SDSE term | Tracking sheet term |
|---|---|---|---|---|
| Team unit | **Pod** | Group | **Team** | **Squad** (Alpha/Beta/Gamma) |
| Student leader | **Maintainer** | Group Leader | **Team Lead** | — |
| Faculty | Faculty (PM/Admin) | Faculty | Mentor (tier) | (implied) |
| Student | Contributor | Participant/Student | Junior/Engineer | **Mentee** |
| Work item | Issue (M-labeled) | Weekly milestone task | Issue (backlog) | Task |
| Coordination body | — | — | — | **LCC** = "Learner Career Council" *and* "Leadership & Coordination Committee" |

---

## 9. Conflicts, Gaps & Ambiguities (Must be Resolved by Configuration)

These are the contradictions found in the corpus. The platform resolves each by making the underlying value **admin-configurable** rather than fixed.

1. **Phase model conflict:** 4-phase/8-week (Planning doc) vs 2-phase/5-week (PDF/ML). → Phases are configurable entities.
2. **Inactivity threshold conflict:** "No update 3/5 days" (PRD.md) vs "No Updates 4+ Days" (Mentor Dashboard legend) vs "No updates 7+ days" (Weekly Reviews auto-flag). → Threshold is a rule parameter.
3. **LCC name conflict:** "Learner Career Council" vs "Leadership & Coordination Committee." → Store canonical role `LCC` with configurable display name.
4. **Team-size variance:** AI Pod=5, ML unspecified, SDSE=9–13. → Team size is per-domain config, not fixed.
5. **Individual project in ML:** drive docs mandate group + individual projects; ML structure says one shared project only. → Project-track count configurable per domain.
6. **No formal student grading rubric in ML/AI** (only model-performance metrics); SDSE uses equal-weight criteria; drive uses 35/25/20/15/5. → Configurable weighted-rubric engine.
7. **Milestone status vocabulary** differs (AI: `Todo`; SDSE: DoD stages; sheets: L2/L3/L4 enums). → Configurable status sets per workflow type.
8. **CI maturity varies** (3/6 AI repos lack real CI). → GitHub integration must tolerate missing CI gracefully.

---

## 10. Inputs This Analysis Hands to the PRD

| Platform capability | Sourced from |
|---|---|
| RBAC (6 roles) + domain scoping | All role definitions §3; SDSE/Shipyard RBAC §7.3 |
| L1–L4 review workflow engine | Tracking sheets §4 |
| Auto-flag + escalation automation | §4.2, §4.3, SDSE SLAs §7.3 |
| Concern/Blocker lifecycle + ticketing | PRD.md Section F §5; LCC issue-resolution §3; concern-routing mandate |
| Group/Individual project + task + milestone tracking | PRD.md Sections C/D §5; AI milestones §7.1; SDSE phases §7.3 |
| Skill-growth tracking | PRD.md Section E §5; "skill growth 15%" §6.5 |
| Mentor accountability / 360° feedback | PRD.md Section B §5 |
| Configurable phases/gates/rubrics | §6 (both models), §9 |
| GitHub integration (commits/PRs/issues/CI/milestones) | AI §7.1, SDSE §7.3, drive GitHub policy |
| Discord integration (activity, weekly-log, channels) | Drive docs (Discord = backbone), channel maps |
| Calendar integration (reviews, deadlines, events) | Faculty review meetings, weekly cadences §6.4 |
| Email center + automated notifications | LCC bulk-comms §3; escalation routing; notification triggers §4 |
| Analytics (student/mentor/teacher/LCC) | Dashboard sheet §2; top-team rubric §6.5; KPIs across §7 |
| Audit logs | Mentorship Log (Section G) §5; append-only sheet discipline |

---

*End of analysis report. Proceed to [02_Platform_PRD.md](02_Platform_PRD.md).*
