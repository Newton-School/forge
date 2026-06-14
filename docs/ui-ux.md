# UI/UX — Design System & Component Library

> Aesthetic target: **Jira + Linear + Vercel Dashboard**. Clean white surfaces, neutral grays, crisp 1px borders, data-dense tables, restrained accent color, zero gradients/glassmorphism/gaming UI. Enterprise, calm, fast.

---

## 1. Design Principles

1. **Data first, chrome second.** Screens are tables, lists, and metrics — not decorative cards. Whitespace and typography do the work.
2. **One accent, used sparingly.** A single indigo/blue accent for primary actions, links, active nav, and selected states. Everything else is neutral.
3. **Borders over shadows.** Structure comes from hairline borders (`border-zinc-200`) and subtle backgrounds (`bg-zinc-50`), not heavy drop shadows. (Linear/Jira do this.)
4. **Status via small, quiet signals.** Color is reserved for status badges and flags (🟢🟡🔴), never for whole-card fills.
5. **Dense but breathable.** Compact row heights, 8px spacing grid, generous container padding. Information density like Jira backlogs.
6. **Consistent surfaces.** Three elevation levels only: page (`bg-zinc-50`), surface/card (`bg-white`), inset (`bg-zinc-50/muted`).
7. **Predictable layout.** Fixed left sidebar + sticky top bar + scrollable content. Same skeleton for every role.

---

## 2. Design Tokens

Defined as CSS variables in `app/globals.css` via Tailwind v4 `@theme`. Light theme is the product default (white background per brief); tokens are structured so a dark theme can be added later.

### 2.1 Color (neutral-led)

| Token | Light value | Use |
|---|---|---|
| `--background` | `#ffffff` | app surface |
| `--muted` / page | `#fafafa` (`zinc-50`) | page background, insets |
| `--foreground` | `#18181b` (`zinc-900`) | primary text |
| `--muted-foreground` | `#71717a` (`zinc-500`) | secondary text, labels |
| `--border` | `#e4e4e7` (`zinc-200`) | hairlines, dividers |
| `--accent` (primary) | `#4f46e5` (`indigo-600`) | primary buttons, links, active nav |
| `--accent-foreground` | `#ffffff` | text on accent |
| `--ring` | `#a5b4fc` (`indigo-300`) | focus rings |

### 2.2 Semantic status palette (badges/flags only)

| Status meaning | Token | Color |
|---|---|---|
| Success / On Track / 🟢 Doing Well | `--status-green` | `emerald-600` on `emerald-50` |
| Warning / Needs Consistency / 🟡 | `--status-amber` | `amber-600` on `amber-50` |
| Danger / No Updates / 🔴 / Escalated | `--status-red` | `rose-600` on `rose-50` |
| Info / In Progress / Scheduled | `--status-blue` | `blue-600` on `blue-50` |
| Neutral / Draft / Closed | `--status-zinc` | `zinc-600` on `zinc-100` |

### 2.3 Typography
- **Sans:** Geist (already wired in root layout) — UI text.
- **Mono:** Geist Mono — IDs, code, commit hashes, GitHub refs.
- Scale: `text-2xl/semibold` page titles · `text-sm` body/table · `text-xs` labels/meta. Tight tracking on headings.

### 2.4 Spacing, radius, motion
- 8px spacing grid; container `px-6 py-6`, cards `p-4`/`p-5`.
- Radius: `rounded-md` (6px) default, `rounded-lg` (8px) for cards/dialogs. No pills except status badges (`rounded-full`).
- Motion: 120–160ms ease for hovers/menus only. No flashy transitions.

---

## 3. Layout System

```
┌───────────────────────────────────────────────────────────────┐
│ TopNav (sticky, h-14): breadcrumb · search · notifications · ⊕ │
│                          · AI assist · avatar menu             │
├──────────────┬────────────────────────────────────────────────┤
│  Sidebar     │  Content area (bg-zinc-50, scrollable)          │
│  (w-60,      │  ┌──────────────────────────────────────────┐  │
│  fixed)      │  │ PageHeader: title · subtitle · actions     │  │
│  • brand     │  ├──────────────────────────────────────────┤  │
│  • role chip │  │ StatCards row (KPIs)                       │  │
│  • nav tree  │  ├──────────────────────────────────────────┤  │
│  • secondary │  │ DataTable / DetailView / Charts            │  │
│  • user      │  └──────────────────────────────────────────┘  │
└──────────────┴────────────────────────────────────────────────┘
```

- **Sidebar (`w-60`)**: brand → role/domain context chip → primary nav tree (role-specific) → secondary section (Concerns, Notifications, Profile) → user block at bottom. Active item: accent left-border + `bg-zinc-100`. Section labels in `text-xs uppercase text-zinc-400`.
- **TopNav (`h-14`)**: left = breadcrumbs; right = global search (⌘K-style), `+ Raise Concern` quick action, notifications bell w/ count, AI-assist sparkle, avatar dropdown (profile, theme, sign out). A **dev-only Role Switcher** sits here in Phase 1 so all six dashboards are previewable.
- **Responsive**: sidebar collapses to an icon rail < `lg`, then to a sheet drawer < `md`. Tables become horizontally scrollable / stacked.

---

## 4. Component Library (`components/ui` — shadcn-style)

Primitives (Radix-backed where interactive, CVA variants, `cn()` merge):

| Component | Notes |
|---|---|
| `Button` | variants: `default` (accent), `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes `sm/md/lg/icon` |
| `Card` (+Header/Title/Description/Content/Footer) | white surface, `border`, `rounded-lg`, no heavy shadow |
| `Badge` | variants map to semantic status palette |
| `Table` (+Header/Body/Row/Head/Cell) | dense; zebra optional; sticky header |
| `Input`, `Textarea`, `Label`, `Select`, `Checkbox` | form controls, focus ring |
| `Tabs` | underline style (Linear-like) |
| `DropdownMenu` | row actions, avatar menu |
| `Dialog` / `Sheet` | modals, drawers (raise concern, compose email) |
| `Avatar` | initials fallback |
| `Tooltip`, `Separator`, `ScrollArea`, `Popover` | supporting |
| `Skeleton` | loading states |

### 4.1 Composite components (`components/dashboard`, etc.)
- `PageHeader` — title, subtitle, breadcrumb slot, right-aligned action buttons.
- `StatCard` — label, big value, delta, optional sparkline; thin border, no fill.
- `DataTable` — column defs, sorting, filter bar, pagination, row click → detail; empty + loading states.
- `EmptyState` — icon, message, CTA.
- `ChartCard` — wraps a chart in a titled card (charts: lightweight, Phase 2 may add Recharts; Phase 1 uses simple bar/line/sparkline SVG or placeholders).
- `StatusBadge` / `FlagBadge` — encode L2/L3/L4 enums and 🟢🟡🔴.
- `ConcernTimeline` — vertical event stream with status transitions.
- `UpdateForm` (L1), `MentorReviewCard` (L3), `WeeklyReviewQueue`.
- `GithubActivityFeed`, `DiscordPanel`, `CalendarList`.
- `ComposeEmail`, `RecipientPicker`, `TemplateEditor`.
- `AiAssistPanel` — slide-over for Groq suggestions.

---

## 5. Navigation Hierarchy (per role)

Driven by `lib/nav/nav.config.ts` (role → menu tree). Summary:

| Role | Primary nav |
|---|---|
| **Mentee** | Dashboard · Tasks · Deliverables · Milestones · Reviews · Feedback · Team · *(Raise Concern)* |
| **Mentor** *(also leads the team — no separate Team Lead role)* | **Mentorship:** Dashboard · My Mentees · Reviews (L2/L3)  ·  **Team Delivery:** Team · Issues/PRs · Blockers · Tasks · Deliverables · *(Raise Concern)* |
| **Teacher** | Domain Overview · Teams · Students · Reviews (L4 + Gates) · Mentor Performance · Analytics · Concerns |
| **LCC** | Global Dashboard · Drive Health · Domains · Teams · Concerns · Email Center · Onboarding · Demerits · Analytics |
| **Admin** | Overview · Users · Domains · Teams · Roles · Configuration · Integrations · Email Templates · Audit Logs |

Shared (all roles): Notifications, Profile/Settings, global Search, Raise Concern.

---

## 6. Key Screen Specs (the ones to review this phase)

- **Login** — centered card on `bg-zinc-50`; product mark, email + password, "Forgot password?". **No signup link.** First login → forced password-change screen.
- **Mentee Dashboard** — identity strip (mentor/teacher/team/domain/squad) · "Next up" (pending update CTA, upcoming deadlines) · tabs (Milestones, Tasks, Deliverables, Feedback) · activity rail (GitHub/Discord/Calendar). Persistent "Submit Update" + "Raise Concern".
- **Mentor Dashboard** — the **L2 mentee table**: Updates This Week · Last Update · Blocker Streak · Status (🟢🟡🔴 badge) · Days Since Update · Action Needed. Tabs: My Mentees · Weekly Reviews (L3) · Tasks · Calendar.
- **Mentor — Team Delivery** — Jira-style board (`Backlog · In Progress · In Review · Done · Released`) synced from GitHub; blocker panel with SLA timers; "Generate weekly summary". (The Mentor leads the team, so these delivery tools live under the Mentor role.)
- **Teacher Dashboard** — domain selector · on-track/at-risk metrics · groups grid · L4 review queue · faculty gates · mentor performance.
- **LCC Console** — drive-health header (completion %, delayed deliverables, inactive teams, open concerns) · domain comparison · concern queue · email center.
- **Admin Console** — users (create/import), org structure, **drive configuration** (phases/gates/review cycles/thresholds/rubrics), integrations, email templates, audit logs.
- **Concern detail** — header (category, severity, status chip, SLA countdown) · `ConcernTimeline` · resolution box · linked entity.

---

## 7. Accessibility & States
- WCAG 2.1 AA: keyboard nav, visible focus rings, ARIA labels on icon buttons, sufficient contrast (neutral palette already high-contrast).
- Every data surface implements **four states**: loading (skeleton), empty (EmptyState), error (inline message), populated.
- Status is never color-only — badges pair color with text/icon.

---

## 8. Reusability Rules
- All visual styling flows from tokens + `cn()`; no ad-hoc hex values in components.
- Primitives are dumb/presentational; data and permissions are passed in.
- Permission-aware rendering uses `can()` from `lib/rbac` (UI hint only; server is the gate).
- `components.json` is configured so future shadcn `add` commands drop into the same `components/ui` with the same tokens.
