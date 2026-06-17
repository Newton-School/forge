# Forge — Landing Page Content

**Final copy. Not placeholder.** This is the on-brand, production marketing content for every section of the Forge landing page, in canonical order.

Forge is built by the **Learner Career Council (LCC)** at **Newton School of Technology (NST)**. It is a multi-domain (AI / ML / SDSE) **Profile Building Drive** platform where Students build, Mentors guide, Teachers track, and learning becomes measurable through real GitHub contribution.

> **Voice guide for whoever builds the page:** premium, confident, precise, human. University innovation launch — not generic SaaS. Every claim below is backed by something the platform actually does. Sample data (team names, repos, PRs, people, metrics) is illustrative and fits an NST AI/ML/SDSE drive.

---

## 1 — Hero

**Eyebrow:** By the Learner Career Council · Newton School of Technology

**Headline:** Where learning is built, not just attended.

**Subhead:** Forge is the Profile Building Drive platform where students ship real work, mentors guide in the open, and teachers see progress that's measured in commits, pull requests, and reviews — not attendance.

**Body (optional, one short paragraph under subhead):** Across AI, ML, and SDSE, every contribution lives where engineers actually work: GitHub. Forge connects that work to mentorship, structured reviews, and a record of growth you can point to.

**Primary CTA:** Sign in with NST Google
**Secondary CTA:** See how the drive works

**Microcopy under CTAs:** Invite-only. Restricted to NST accounts.

**Hero stat chips (3–4):**
- `3 domains` — AI · ML · SDSE, one platform
- `5 roles` — Admin · LCC · Teacher · Mentor · Mentee
- `100% GitHub-verified` — every contribution, signature-checked
- `L1 → L4 reviews` — daily updates to teacher decisions

---

## 2 — Why Forge Exists

**Eyebrow:** The problem

**Headline:** Traditional learning can't see the work.

**Subhead:** Courses measure attendance and assignments. They rarely measure whether someone can actually build — and they leave mentors and teachers guessing. Forge fixes the five places that breaks down.

**Body (narrative + how Forge solves each):**

Most programs run on a few familiar assumptions, and each one quietly fails the learner.

- **Problem — Learning is invisible.** A grade on an assignment says nothing about how someone got there, what they were stuck on, or whether they can do it again.
  **Forge —** Progress is the trail of real work: commits, branches, pull requests, reviews, and milestones, captured automatically from GitHub.

- **Problem — Mentorship doesn't scale.** Good mentors exist, but their guidance lives in scattered DMs and one-off calls that no one can see or learn from.
  **Forge —** Mentorship is structured and visible — daily mentee updates, weekly mentor reviews, and a shared record the whole team learns from.

- **Problem — Teachers fly blind.** By the time a student is struggling enough to notice, weeks are gone.
  **Forge —** L1–L4 reviews and auto-flags surface consistency gaps, repeated blockers, and silence early — while there's still time to act.

- **Problem — Learning and building are separated.** Students learn in one place and build in another, so theory never gets pressure-tested by real delivery.
  **Forge —** Building *is* the curriculum. Issues, PRs, and milestones are the lesson plan, and the lesson is delivered work.

- **Problem — There's nothing to show at the end.** A certificate isn't evidence.
  **Forge —** A drive on Forge produces a real contribution history — the thing recruiters and graduate programs actually trust.

---

## 3 — How the Ecosystem Works

**Eyebrow:** The flow

**Headline:** One line from a teacher's intent to a learner's growth.

**Subhead:** Forge connects every role and every system into a single chain, so work flows in one direction and visibility flows back the other way.

**Flow caption (Teacher → Mentors → Teams → Repos → Issues → PRs → Reviews → Learning):**

`Teacher` sets the direction for a domain → `Mentors` lead their teams and translate it into work → `Teams` organize around shared repositories → `Repos` hold the issues that define what gets built → `Issues` become `Pull Requests` as students ship → `Reviews` turn that work into feedback and decisions → `Learning` is the measurable result, recorded and visible to everyone who needs it.

**Per-stage micro-captions (for diagram nodes):**
- **Teacher** — Owns one or more domains; sets standards and makes the final call.
- **Mentors** — The student mentor leads the team and guides day to day.
- **Teams** — A pod of mentees working a shared project.
- **Repos** — The GitHub home of the team's work.
- **Issues** — The unit of work, self-assigned by contributors.
- **PRs** — Where finished work is proposed and reviewed.
- **Reviews** — L1–L4: from daily updates to teacher decisions.
- **Learning** — Measured, recorded, and visible.

---

## 4 — AI Domain Workflow

**Eyebrow:** Built for how each domain actually works

**Headline:** The AI domain runs on a GitHub organization. ML and SDSE run on repos.

**Subhead:** Forge meets each domain where it already is, so connecting GitHub takes a click and contribution syncs the moment it happens.

**Body:**

**AI domain — organization-native.** AI teams live inside a shared GitHub **organization**. Forge installs a single **org webhook** with a read-scoped token and maps GitHub **Teams** to Forge teams. New repositories are covered automatically — no per-repo setup, no missed activity.

**ML & SDSE — per-repo, on demand.** When a mentor clicks **"Connect with GitHub,"** Forge provisions a **per-repo webhook** (using the same shared secret) on that team's repository. From that moment, every commit, pull request, issue, review, and milestone flows in.

**Either way — verified at the door.** Every incoming event is **HMAC-verified** before it's trusted. Activity is matched to a person by their **permanent GitHub user id**, never a renameable username — so a handle change never breaks someone's history.

**Mock-data captions:**
- `nst-ai-drive-2026` · org-wide webhook active · 14 repos covered
- Team **Perceptron** → GitHub Team `@nst-ai/perceptron` (auto-mapped)
- `vision-anomaly-detector` connected by **Ananya Rao** · last sync 2m ago
- 1,284 events ingested today · 100% signature-verified

---

## 5 — Project Lifecycle

**Eyebrow:** From idea to merge

**Headline:** Eight stages. One honest path to shipped work.

**Subhead:** Every project on Forge follows the same lifecycle the rest of the engineering world uses — because the goal is to build engineers, not assignment-finishers.

**The 8 stages (label + one line):**

1. **Issue** — Work is defined as a GitHub issue with clear scope and acceptance criteria.
2. **Self-assign** — A contributor takes ownership; accountability starts with them.
3. **Branch** — A focused branch is cut from the issue, isolating the change.
4. **Development** — The work gets built, committed in the open, day by day.
5. **Pull Request** — Finished work is proposed for review, not merged in silence.
6. **Review** — Mentors and peers review the code and the reasoning behind it.
7. **Merge** — Approved work lands on the main line and becomes part of the project.
8. **Milestone** — Merged work rolls up into a milestone — a visible marker of real progress.

**Sample lifecycle (illustrative):**
`#142 Implement retrieval cache for RAG pipeline` → self-assigned by **Rohan Mehta** → branch `feat/142-retrieval-cache` → 9 commits → PR **"Add Redis-backed retrieval cache (#142)"** → reviewed by mentor **Sara Khan** → merged → counts toward milestone **"M3 · Production-ready inference"**.

---

## 6 — Mentor Experience

**Eyebrow:** For mentors

**Headline:** Lead the team. Forge handles the bookkeeping.

**Subhead:** The student mentor carries both mentorship and team delivery. Forge gives them the visibility to do it well — and takes the manual tracking off their plate.

**Body:**

A mentor on Forge connects the team's repo once, then works from a live picture: who's contributing, who's quiet, what's blocked, and what needs a decision. Daily mentee updates roll up into a weekly status; auto-flags catch the problems a busy mentor would miss. Groq AI drafts review summaries and contribution insights so the mentor spends time mentoring, not summarizing.

**Capability list / microcopy:**
- One-click **"Connect with GitHub"** to link the team's repository (ML / SDSE).
- Daily mentee updates (L1) → mentor status (L2) → weekly review (L3) at a glance.
- Auto-flags for consistency gaps, repeated blockers, and silence.
- AI-assisted review summaries and progress analysis — drafts you stay in control of.
- Mentorship log, action items, and next check-ins in one place.

**Sample mentor view (illustrative):**
> **Team Perceptron · this week** — 6 of 7 members 🟢 on track · **Aditya V.** 🟡 needs consistency (2 updates) · **Repeated blocker:** "CUDA OOM on training run" flagged for Aditya (3 updates). Suggested action: pair session on batch sizing.

---

## 7 — Teacher Experience

**Eyebrow:** For teachers

**Headline:** See the whole domain — and intervene before it's too late.

**Subhead:** Teachers span multiple domains and own the final call. Forge gives them a domain-wide signal without making them read every commit.

**Body:**

A teacher sees their domain through the reviews that matter, not the noise. Mentor weekly reviews (L3) surface up to a teacher decision (L4): **Continue**, **Monitor**, or **Schedule Discussion**. Auto-flags and escalation rules push the at-risk cases to the top, so attention goes where it's needed. Every decision is recorded, every action audited.

**Capability list / microcopy:**
- Domain-wide rollup across every team and mentor.
- L4 decisions: Continue · Monitor · Schedule Discussion.
- Escalations and auto-flags surface at-risk learners early.
- Rubric-based evaluation and team rankings at gate reviews.
- Full audit trail behind every decision.

**Sample teacher view (illustrative):**
> **AI Domain · Week 7** — 9 teams · 61 mentees · **4 flagged for discussion**. Top concern: Team **Backprop** behind on M2 (milestone 41% complete, due in 3 days). Decision logged: **Schedule Discussion** with mentor **Imran S.**

---

## 8 — Mentee Experience

**Eyebrow:** For students

**Headline:** Do the work. Build the record. Get the guidance.

**Subhead:** As a mentee, you build in the open, log what you learned, and get feedback that's tied to the actual code — not a grade with no explanation.

**Body:**

Pick up an issue, cut a branch, ship a pull request — the same loop real engineers run. A two-minute daily update captures what you worked on, what you learned, what's blocking you, and what's next. Your mentor sees it, your progress is recorded, and at the end of the drive you have a verified contribution history that speaks for itself.

**Daily update fields (the L1 form):**
- **Worked on** — what you shipped today
- **Learning** — what you now understand that you didn't yesterday
- **Blocker** — what's in your way (optional)
- **Next goal** — what you'll do next

**Sample daily update (illustrative):**
> **Priya Sharma · today** — *Worked on:* wired the eval harness to log per-class F1. *Learning:* how `sklearn` macro vs. weighted averaging changes the story on imbalanced data. *Blocker:* none. *Next goal:* open PR for the metrics module and request review.

---

## 9 — The Connected Learning Ecosystem

**Eyebrow:** Everything in one place

**Headline:** Five systems, one source of truth.

**Subhead:** Forge doesn't replace the tools engineers love — it connects them. GitHub, Discord, Google Calendar, Email, and Groq AI feed a single, governed record of the drive.

**Body:**

Most platforms ask you to abandon your tools and live inside theirs. Forge does the opposite. Work stays on GitHub, conversation stays on Discord, schedules stay on Google Calendar — and Forge weaves them together so students, mentors, teachers, and the LCC all see the same truth, scoped to exactly what they're allowed to see. The client only renders this; all the wiring lives safely on the server.

**The five (one-liners):**
- **GitHub** — the contribution spine: commits, PRs, issues, reviews, milestones.
- **Discord** — communication: channels, mentor discussions, announcements.
- **Google Calendar** — the shared Forge Drive calendar: sessions, reviews, deadlines.
- **Email** — invites, reminders, notifications, and escalations.
- **Groq AI** — review summaries, contribution insights, and progress analysis that assist mentors.

---

## 10 — Interactive Integration Showcase

**Eyebrow:** See the integrations in motion

**Headline:** Real systems. Real signal. Verified end to end.

**Subhead:** Each integration is server-only, signature-verified where it matters, and scoped by role and domain. Below is the kind of live data each one brings into Forge.

> **Note for build:** this section is interactive — tabs or cards for GitHub, Discord, Calendar, Email, Groq. Copy and mock captions for each below.

### GitHub
**Heading:** GitHub — the contribution spine
**Explainer:** Every commit, pull request, issue, review, and milestone flows into Forge through HMAC-verified webhooks — org-wide for AI, per-repo for ML and SDSE. Activity is matched to a person by permanent GitHub id, so the record stays accurate even when handles change. This is the work itself, not a summary of it.
**Mock-data captions:**
- PR merged · **"Add Redis-backed retrieval cache (#142)"** · `vision-anomaly-detector` · by @rohan-m, reviewed by @sara-k
- Issue opened · **"Handle empty batch in dataloader (#157)"** · self-assigned by @ananya-r
- Review submitted · **"Changes requested: add tests for edge cases"** · Team Perceptron
- Milestone · **"M3 · Production-ready inference"** · 7 of 12 issues closed (58%)

### Discord
**Heading:** Discord — where the team talks
**Explainer:** Forge maps each team to its Discord channel and links activity to permanent Discord ids. Mentor discussions, announcements, and team chatter become part of the visible drive — communication counts as participation, and quiet teams are easy to spot.
**Mock-data captions:**
- `#team-perceptron` · 34 messages today · most active: @priya, @rohan
- Mentor discussion · **Sara Khan** posted in `#mentors-ai` · "Reviewing M3 PRs tonight"
- Announcement · **"Gate 2 reviews moved to Saturday 11:00"** · pushed to 9 channels
- New member joined `#team-backprop` · linked to **Aditya Verma**

### Google Calendar
**Heading:** Google Calendar — the shared Forge Drive calendar
**Explainer:** Sessions, reviews, milestones, and deadlines live on one shared Forge Drive calendar, synced for everyone in scope. Nobody misses a gate review or a deadline because it wasn't on their calendar — it always is.
**Mock-data captions:**
- **Mentor meeting** · Team Perceptron · Tue 17:00–17:30
- **Gate 2 Review** · AI Domain · Sat 11:00 · rubric-scored
- **Deadline** · Milestone M3 due · Fri 23:59
- **Milestone** · Phase 2 demo day · Jun 27

### Email
**Heading:** Email — invites, reminders, escalations
**Explainer:** Forge sends the transactional email that keeps a drive moving: invite-only onboarding, deadline reminders, review notifications, and escalations when a flag goes unaddressed. Every send is tracked from draft to delivered.
**Mock-data captions:**
- Invitation · **"You're invited to the NST AI Drive 2026 on Forge"** · Pending → Sent → Opened
- Reminder · **"Your daily update is due — Team Perceptron"** · sent to 7 mentees
- Notification · **"Sara Khan requested changes on your PR #142"**
- Escalation · **"3 mentees flagged 🔴 in Team Backprop — review needed"** · to teacher

### Groq AI
**Heading:** Groq AI — assists the mentor, never replaces them
**Explainer:** Groq turns raw activity and updates into review summaries, contribution insights, and progress analysis — fast, rate-limited, and capped. It drafts; the mentor decides. AI accelerates judgment here; it doesn't substitute for it.
**Mock-data captions:**
- Weekly summary · **"Perceptron shipped 4 PRs; momentum strong, M3 on track."**
- Contribution insight · **"Rohan: high PR throughput, low review participation — nudge to review peers."**
- Progress analysis · **"Aditya: 2 updates this week vs. team avg 5 — consistency gap."**
- Blocker pattern · **"'CUDA OOM' recurring across 3 updates — likely batch-size issue."**

---

## 11 — Learning + Building

**Eyebrow:** The difference that matters

**Headline:** You don't learn to build. You build to learn.

**Subhead:** This is Forge's strongest claim: on Forge, the building *is* the learning. Not a project bolted onto a course — the project is the course.

**Body:**

Traditional programs teach a concept and then, maybe, assign a project to practice it. Forge inverts that. The work comes first: a real issue in a real repo, with real constraints. The concepts get learned in the act of shipping it — pressure-tested by review, defended in a pull request, recorded in a daily update. By the time a milestone is signed off, the student hasn't just *heard* about retrieval caches or model evaluation or distributed builds — they've built one, and there's a commit history to prove it.

That's the whole bet: learning you can't fake, because it's the same as building you can't fake. When the drive ends, a student walks away with two things a certificate never gives — the ability, and the evidence.

**Pull-quote:** "At NST, a transcript is a list of what you sat through. A Forge profile is a list of what you built."

---

## 12 — Analytics & Visibility

**Eyebrow:** Measured, not guessed

**Headline:** Progress you can actually point to.

**Subhead:** Forge turns activity into signal — for the student tracking their own growth, the mentor steering a team, the teacher owning a domain, and the LCC running the drive.

**Body:**

Because every contribution is captured at the source, Forge can show progress honestly: how much is shipping, where momentum is building, who's at risk, and how a milestone is really tracking. Auto-flags catch consistency gaps (fewer than 3 updates in a week), repeated blockers (the same blocker across 3+ updates), and silence (no updates past the threshold) — so problems surface as signal, not surprises.

**Sample metrics (illustrative):**
- **AI Domain · Week 7** — 9 teams · 61 mentees · 142 PRs merged · 38 milestones hit
- **Team Perceptron** — 6/7 🟢 on track · 1 🟡 · momentum +18% week over week
- **Milestone M3** — 58% complete · on track for Fri deadline
- **Auto-flags this week** — 4 consistency gaps · 2 repeated blockers · 1 no-updates

**Status legend (microcopy):**
- 🟢 Doing well · 🟡 Needs consistency · 🔴 No updates (4+)
- Mentor status: On track · At risk · Needs discussion
- Teacher decision: Continue · Monitor · Schedule discussion

---

## 13 — Security & Governance

**Eyebrow:** Trust by design

**Headline:** Invite-only. Scoped. Audited. Verified.

**Subhead:** Forge handles real student data and real institutional decisions, so it's built like it. Security isn't a feature here — it's the foundation.

**Body:**

Access is **Google OAuth only** — no passwords, no self-signup. You get in only if your account is on the NST hosted domain **and** already on the admin allowlist; everyone is invited by Admin or the LCC. Sessions live **server-side** (Redis-backed); the browser holds nothing but an opaque session id. Every request passes three layers of **RBAC** — route gate, policy check, and a scope-filtered database query — so domain isolation and team isolation are enforced in the data itself, never trusted from the frontend. Every webhook is **HMAC-verified** before it's believed. And every privileged action is written to an **immutable audit log** — who, what, before, after, when.

**Trust points (microcopy):**
- **Google OAuth only** — NST hosted-domain + admin allowlist, invite-only.
- **Server-side sessions** — opaque cookie, no tokens in the browser, CSRF-protected.
- **Three-layer RBAC** — route → policy → scope-filtered query.
- **Domain & team isolation** — enforced at the database, not the UI.
- **HMAC-verified webhooks** — every GitHub event checked before trust.
- **Immutable audit log** — every privileged action recorded.

---

## 14 — Platform Architecture

**Eyebrow:** Under the hood

**Headline:** A thin client. A serious server. Clean boundaries.

**Subhead:** Forge is engineered like the platform it is — UI on one side, all the logic and integrations on the other, deployed with zero blast radius.

**Body:**

The **client** (Next.js) renders UI and nothing else — no business logic, no database, no direct calls to GitHub, Discord, Google, or Groq. The **server** (Express + TypeScript) owns everything: authentication, RBAC, business rules, every integration, email, notifications, analytics, audit logging, and webhooks. State lives in **PostgreSQL** with **Redis** for sessions and cache. It all runs on **AWS ECS Fargate** behind a load balancer, in a dedicated, isolated account footprint — Forge can't reach the other services it shares an account with, and they can't reach it.

**Architecture line (for diagram):**
`Client (Next.js — UI only)` → `Server (Express — all logic & integrations)` → `PostgreSQL + Redis` · deployed on `AWS ECS Fargate`

**Principle chips:**
- Client = UI only · Server owns logic
- Layered: routes → controllers → services → repositories
- Validated at the boundary (Zod) · audited end to end
- Dedicated VPC, RDS, and secrets — zero blast radius

---

## 15 — CTA

**Eyebrow:** Newton School of Technology · Learner Career Council

**Headline:** Build something real this drive.

**Subhead:** Forge is invite-only and built for the NST community — AI, ML, and SDSE. If you're in the drive, your work has a home, your mentor has a view, and your growth has a record.

**Body (one line):** Sign in with your NST account to step into the drive.

**Primary CTA:** Sign in with NST Google
**Secondary CTA:** Talk to the LCC

**Footer microcopy:**
- Forge · A Learner Career Council platform at Newton School of Technology
- Invite-only access · NST accounts only · Google OAuth
- Built where engineers build. Measured by what gets shipped.
