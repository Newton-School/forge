# Landing Page — Component Map

A concrete, codebase-specific map of every landing-page section to React components for the **Forge** `client/` app. This document is the build spec: it names files, the server-vs-client boundary, typed props, the shared primitives + existing UI primitives each section reuses, lucide icons, the visualization technique, and the mock-data fixtures.

> Read alongside `client/CLAUDE.md`. Every rule there still applies on the marketing page: Server Components by default; `"use client"` only for interactivity; Tailwind v4 `@theme` tokens (no ad-hoc hex); `cn()` for class merge; data via `@/lib/api` (never `@/lib/mock/data` directly); accessibility (keyboard, focus, ARIA, contrast); loading/empty/error/populated where a surface reads data.

---

## 0. Stack & constraints (as they bind this page)

| Concern | Decision for the landing page |
| --- | --- |
| Framework | Next.js 16 App Router, Turbopack, **RSC by default** |
| React | 19 |
| Language | TypeScript (strict, typed props on every component) |
| Styling | Tailwind v4 via `@theme` tokens in `app/globals.css`. Indigo `--primary` (#4f46e5) accent on zinc grays. Use token classes (`bg-primary`, `text-muted-foreground`, `border-border`) — **no ad-hoc hex** |
| Class merge | `cn()` from `@/lib/utils` |
| Icons | `lucide-react` (already a dep, `^1.18.0`) |
| Provider logos | `BrandIcon` (`@/components/integrations/brand-icon`) from `/public`, not lucide |
| Animation | **`motion`** (Framer Motion) — **NEW dependency, must be added** (`npm i motion`). Not currently in `package.json` |
| Visualizations | SVG + Canvas + CSS only. **No three.js in v1** |
| Data | Async accessors on `@/lib/api` (`api.*`). Add new landing fixtures to `lib/mock/` and expose them through `lib/api/index.ts` |
| Path alias | `@/*` → `client/` root |

### Marketing-shell exception to the app design language

`client/CLAUDE.md` forbids gradients/glassmorphism in the **app** (Jira/Linear data-dense surfaces). The marketing page is the deliberate exception: it may use subtle gradients (e.g. `GradientText`, hero canvas glows) and motion. Keep it tasteful and on-token — gradients are built from `--primary`/zinc via `color-mix`, animations respect `prefers-reduced-motion`. The app routes under `(app)` remain unchanged.

---

## 1. Route structure (planned — documented and refined)

The landing page lives in a **`(marketing)` route group** so it gets its own full-bleed shell with no app sidebar. Refinement vs. the brief: the marketing page is the public root, so `(marketing)/page.tsx` **is** the landing page (no extra `/landing` segment). The existing `app/page.tsx` redirect-to-role behavior moves behind auth in Phase 3; for now keep it, and reach the marketing page at `/` via the route group's `page.tsx`. If a literal `/landing` URL is required, add `(marketing)/landing/page.tsx` that simply renders the same composition — documented below as optional.

```
client/app/
├── layout.tsx                      # ROOT layout — unchanged (fonts, TooltipProvider, globals.css)
├── page.tsx                        # EXISTING role-redirect — leave as-is for Phase 1
├── (auth)/…                        # unchanged
├── (app)/…                         # unchanged (sidebar shell)
└── (marketing)/                    # NEW route group — full-bleed shell, own nav/footer
    ├── layout.tsx                  # NEW marketing shell (server) — MarketingNav + {children} + MarketingFooter
    ├── page.tsx                    # NEW — the landing page (server, composes sections)  [primary URL: /]
    └── landing/
        └── page.tsx                # OPTIONAL — renders the same <LandingPage/> composition at /landing
```

> Route groups `( … )` do not affect the URL. `(marketing)/page.tsx` serves `/`. Because both `app/page.tsx` and `(marketing)/page.tsx` would resolve `/`, pick one: the clean move is to **delete the redirect from `app/page.tsx` and let `(marketing)/page.tsx` own `/`**, then gate "enter app" via the nav CTA. Until Phase 3 auth lands, if you must keep both, host the landing page at `/landing` only and keep `app/page.tsx` at `/`. Decide this explicitly before wiring; default recommendation: landing owns `/`.

---

## 2. File tree to create

```
client/
├── app/(marketing)/
│   ├── layout.tsx                              server   marketing shell
│   ├── page.tsx                                server   composes the page
│   └── landing/page.tsx                        server   (optional) /landing alias
│
├── components/landing/
│   ├── landing-page.tsx                        server   ordered composition of all sections
│   │
│   ├── shared/                                 ── shared marketing primitives
│   │   ├── section.tsx                         server   <Section> wrapper (id, padding, max-width)
│   │   ├── reveal.tsx                           client   <Reveal> motion whileInView + reduced-motion
│   │   ├── eyebrow.tsx                          server   <Eyebrow> kicker label
│   │   ├── section-heading.tsx                 server   <SectionHeading> (eyebrow + h2 + lead)
│   │   ├── gradient-text.tsx                   server   <GradientText> brand gradient span
│   │   ├── stat.tsx                            server   <Stat> big-number + label
│   │   ├── mock-frame.tsx                      server   <MockFrame> browser/window chrome wrapper
│   │   ├── marketing-nav.tsx                    client   <MarketingNav> sticky nav (mobile toggle)
│   │   └── marketing-footer.tsx                server   <MarketingFooter>
│   │
│   ├── viz/                                    ── visualization components (mostly client)
│   │   ├── ecosystem-hero.tsx                   client   hero canvas/SVG animated graph
│   │   ├── contribution-graph.tsx              server   GitHub-style SVG heatmap (static)
│   │   ├── node-link-diagram.tsx               client   SVG node-link (EcosystemFlow)
│   │   ├── pipeline-flow.tsx                    client   animated SVG pipeline (ProjectLifecycle)
│   │   ├── connection-map.tsx                   client   animated connection-line map
│   │   ├── layered-diagram.tsx                  server   layered architecture SVG (static)
│   │   └── animated-chart.tsx                   client   motion-driven bar/line chart
│   │
│   └── sections/                              ── one file per canonical section
│       ├── hero-section.tsx                     client   1  Hero
│       ├── why-forge.tsx                        server   2  WhyForge
│       ├── ecosystem-flow.tsx                  server   3  EcosystemFlow
│       ├── ai-domain-workflow.tsx              server   4  AiDomainWorkflow
│       ├── project-lifecycle.tsx               server   5  ProjectLifecycle
│       ├── mentor-experience.tsx               server   6  MentorExperience
│       ├── teacher-experience.tsx              server   7  TeacherExperience
│       ├── mentee-experience.tsx               server   8  MenteeExperience
│       ├── connected-ecosystem.tsx             server   9  ConnectedEcosystem
│       ├── integration-showcase.tsx             client  10  IntegrationShowcase (Radix Tabs)
│       ├── learning-building.tsx               server  11  LearningBuilding
│       ├── analytics-section.tsx               server  12  Analytics
│       ├── security-governance.tsx             server  13  SecurityGovernance
│       ├── platform-architecture.tsx           server  14  PlatformArchitecture
│       └── cta-section.tsx                     server  15  CtaSection
│
└── lib/
    ├── mock/landing.ts                          NEW   landing-only fixtures (typed)
    └── api/index.ts                             EDIT  add api.landing.* accessors
```

> "server" = React Server Component (no directive). "client" = file starts with `"use client";`. A server section that needs one animated child imports a `client` viz/`Reveal` — the boundary is pushed as deep as possible so most section markup stays server-rendered.

---

## 3. Shared primitives (build these first)

| Component | File | Boundary | Key props (typed) | Reuses | Notes |
| --- | --- | --- | --- | --- | --- |
| `Section` | `landing/shared/section.tsx` | server | `{ id?: string; className?: string; size?: "default" \| "wide" \| "narrow"; bleed?: boolean; children: React.ReactNode }` | `cn` | Semantic `<section>` with `id` (anchor target for nav), vertical padding (`py-20 md:py-28`), and a centered max-width container (`max-w-6xl`/`max-w-7xl`). `bleed` skips the inner container for full-width viz. |
| `Reveal` | `landing/shared/reveal.tsx` | **client** | `{ children: React.ReactNode; delay?: number; y?: number; as?: keyof JSX.IntrinsicElements; className?: string; once?: boolean }` | `motion`, `cn` | `motion.div` with `initial={{opacity:0, y}}` / `whileInView={{opacity:1,y:0}}` / `viewport={{ once: true, margin: "-80px" }}`. **Reads `useReducedMotion()`** — when true, render children with no transform/opacity animation. The single wrapper used across all sections for scroll reveal. |
| `Eyebrow` | `landing/shared/eyebrow.tsx` | server | `{ children: React.ReactNode; className?: string }` | `cn` | Small uppercase indigo kicker: `text-xs font-medium uppercase tracking-wide text-primary`. Mirrors `stat-card` label styling. |
| `SectionHeading` | `landing/shared/section-heading.tsx` | server | `{ eyebrow?: string; title: React.ReactNode; lead?: string; align?: "left" \| "center"; className?: string }` | `Eyebrow`, `cn` | Composes `Eyebrow` + `<h2>` (`text-3xl md:text-4xl font-semibold tracking-tight`) + optional lead paragraph (`text-muted-foreground`). Wrap in `Reveal` at call sites. |
| `GradientText` | `landing/shared/gradient-text.tsx` | server | `{ children: React.ReactNode; className?: string }` | `cn` | `bg-clip-text text-transparent` over an on-token indigo gradient built from `--primary` via `color-mix` (no raw hex). Used in hero + CTA headlines. |
| `Stat` | `landing/shared/stat.tsx` | server | `{ value: string; label: string; sub?: string; className?: string }` | `cn` | Marketing big-number (`text-3xl font-semibold tabular-nums`) + muted label. Distinct from app `StatCard` (which is a bordered data tile); this is borderless display type for hero/why strips. |
| `MockFrame` | `landing/shared/mock-frame.tsx` | server | `{ title?: string; variant?: "browser" \| "window"; className?: string; children: React.ReactNode }` | `cn` | Browser/window chrome (top bar with traffic-light dots + optional title), `rounded-lg border border-border bg-card` body. Wraps role-dashboard mockups in sections 6–8. Pure presentational shell. |
| `MarketingNav` | `landing/shared/marketing-nav.tsx` | **client** | `{ ctaHref?: string }` | `Button` (asChild `<a>`), `lucide: Menu, X`, `cn` | Sticky top nav, hairline bottom border, anchor links to section ids, "Enter Forge" CTA → app. Client for the mobile menu toggle + scroll state. |
| `MarketingFooter` | `landing/shared/marketing-footer.tsx` | server | `{ className?: string }` | `Separator`, `BrandIcon`, `lucide: Github` | Multi-column footer: nav anchors, provider logos, copyright. |

---

## 4. Visualization components

All visuals are SVG / Canvas / CSS. Static-shape ones stay server; animated ones are `client` (they use `motion` or `requestAnimationFrame`). Every animated viz checks `prefers-reduced-motion` and degrades to a static frame.

| Viz | File | Boundary | Technique | Key props | Reuses |
| --- | --- | --- | --- | --- | --- |
| `EcosystemHero` | `viz/ecosystem-hero.tsx` | client | **Canvas** (`<canvas>` + `requestAnimationFrame`) particle/constellation of role nodes drifting + linking; fallback static SVG when reduced-motion | `{ density?: number; className?: string }` | `cn`, `useReducedMotion` |
| `ContributionGraph` | `viz/contribution-graph.tsx` | server | **SVG** GitHub-style heatmap grid (52×7 `<rect>`), intensity from data; can be wrapped in `Reveal` for a staggered fill | `{ weeks: ContributionWeek[]; className?: string }` | `cn` |
| `NodeLinkDiagram` | `viz/node-link-diagram.tsx` | client | **SVG** nodes + edges; `motion` path-draw + node pop on inView | `{ nodes: GraphNode[]; edges: GraphEdge[]; className?: string }` | `motion`, `cn` |
| `PipelineFlow` | `viz/pipeline-flow.tsx` | client | **SVG + motion** horizontal pipeline; animated dot travels stage→stage, active stage highlights | `{ stages: PipelineStage[]; className?: string }` | `motion`, `lucide` (per-stage icons), `cn` |
| `ConnectionMap` | `viz/connection-map.tsx` | client | **SVG + motion** central Forge hub with animated connection lines to provider/role endpoints (stroke-dashoffset draw) | `{ hub: MapNode; endpoints: MapNode[]; className?: string }` | `motion`, `BrandIcon`, `lucide`, `cn` |
| `LayeredDiagram` | `viz/layered-diagram.tsx` | server | **SVG/CSS** stacked layer bands (Cloudflare → ALB → ECS client/server → RDS/Redis), labeled | `{ layers: ArchLayer[]; className?: string }` | `cn` |
| `AnimatedChart` | `viz/animated-chart.tsx` | client | **CSS/SVG + motion** bars/line that grow on inView; the marketing animated counterpart to the app's static `BarChart` | `{ series: ChartPoint[]; kind?: "bar" \| "line"; suffix?: string; className?: string }` | `motion`, `cn` |

> The app's `@/components/dashboard/bar-chart` and `@/components/dashboard/stat-card` are **static and presentation-grade** — reuse them verbatim inside `MockFrame` dashboards (sections 6–8) where motion is not wanted, and reserve `AnimatedChart` for the hero-y Analytics section (12).

---

## 5. Canonical sections (1–15)

Each section is a focused component receiving already-resolved data as props (presentational; the page does the `await api.*`). Wrap headings/blocks in `Reveal` at the section level.

### 1 · Hero — `sections/hero-section.tsx`  ·  **client**
- **Why client:** entry animations, the `EcosystemHero` canvas, and CTA interactions.
- **Props:** `{ headline: string; sub: string; stats: { value: string; label: string }[]; primaryCta: { label: string; href: string }; secondaryCta?: { label: string; href: string }; contributionWeeks: ContributionWeek[] }`
- **Reuses:** `Section`, `GradientText`, `Stat`, `Reveal`, `Button` (asChild), `EcosystemHero`, `ContributionGraph`.
- **Icons:** `ArrowRight`, `Sparkles`, `Github`.
- **Viz:** `EcosystemHero` (canvas) as backdrop + a `ContributionGraph` (SVG) in the hero mock as the "profile being built" proof.
- **Data:** `api.landing.hero()` → `LandingHero` (+ `contributionWeeks`).

### 2 · WhyForge — `sections/why-forge.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; pillars: { icon: LucideName; title: string; body: string }[]; stats?: { value: string; label: string }[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Stat`.
- **Icons:** `Layers`, `Users`, `ShieldCheck`, `GitBranch`, `Workflow` (per pillar).
- **Viz:** none (icon + copy grid).
- **Data:** `api.landing.whyForge()` → `WhyForge`.

### 3 · EcosystemFlow — `sections/ecosystem-flow.tsx`  ·  **server** (client child)
- **Props:** `{ heading: SectionHeadingData; graph: { nodes: GraphNode[]; edges: GraphEdge[] } }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `NodeLinkDiagram` (client).
- **Icons:** role/provider glyphs passed into nodes (`GraduationCap`, `UserCog`, `Presentation`, `ShieldCheck`).
- **Viz:** `NodeLinkDiagram` node-link diagram of how Admin/LCC/Teacher/Mentor/Mentee + domains connect.
- **Data:** `api.landing.ecosystemGraph()` → `EcosystemGraph`.

### 4 · AiDomainWorkflow — `sections/ai-domain-workflow.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; steps: { icon: LucideName; title: string; body: string }[]; sample?: ContributionWeek[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `Card`, `ContributionGraph`, `BrandIcon` (github).
- **Icons:** `GitPullRequest`, `GitCommit`, `Bot`, `LineChart`.
- **Viz:** GitHub-as-source-of-truth story — step list + a `ContributionGraph` from real-shaped GitHub fixtures.
- **Data:** `api.landing.aiWorkflow()` and reuse existing `api.githubActivity()`-shaped fixtures.

### 5 · ProjectLifecycle — `sections/project-lifecycle.tsx`  ·  **server** (client child)
- **Props:** `{ heading: SectionHeadingData; stages: PipelineStage[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `PipelineFlow` (client).
- **Icons:** `Lightbulb`, `ListTodo`, `Hammer`, `ClipboardCheck`, `Rocket` (per stage).
- **Viz:** `PipelineFlow` animated pipeline (idea → tasks → build → review → ship).
- **Data:** `api.landing.lifecycle()` → `Lifecycle`.

### 6 · MentorExperience — `sections/mentor-experience.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; features: FeatureItem[]; dashboard: MentorMock }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `MockFrame`, `StatCard`/`StatGrid` (app), `BarChart` (app), `StatusBadge` (app), `Table` (app).
- **Icons:** `Users`, `ClipboardList`, `AlertTriangle`, `CheckCircle2`.
- **Viz:** `MockFrame` "browser" wrapping a faux **Mentor dashboard** built from real app primitives.
- **Data:** `api.landing.mentorMock()` → `MentorMock`.

### 7 · TeacherExperience — `sections/teacher-experience.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; features: FeatureItem[]; analytics: TeacherMock }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `MockFrame`, `BarChart` (app), `StatCard`, `DomainFilter`-styled chips (static).
- **Icons:** `Presentation`, `BarChart3`, `Layers`, `GraduationCap`.
- **Viz:** `MockFrame` wrapping a **Teacher analytics** mock (multi-domain bars + cohort stats).
- **Data:** `api.landing.teacherMock()` → `TeacherMock`.

### 8 · MenteeExperience — `sections/mentee-experience.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; features: FeatureItem[]; dashboard: MenteeMock }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `MockFrame`, `Progress` (app ui), `StatusBadge`, `ContributionGraph`.
- **Icons:** `GraduationCap`, `Target`, `Calendar`, `Trophy`.
- **Viz:** `MockFrame` wrapping a **Mentee dashboard** (tasks + progress + contribution graph).
- **Data:** `api.landing.menteeMock()` → `MenteeMock`.

### 9 · ConnectedEcosystem — `sections/connected-ecosystem.tsx`  ·  **server** (client child)
- **Props:** `{ heading: SectionHeadingData; map: { hub: MapNode; endpoints: MapNode[] } }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `ConnectionMap` (client), `BrandIcon`.
- **Icons:** `Workflow`, `Share2`.
- **Viz:** `ConnectionMap` animated connection-line map (Forge hub ↔ roles + providers).
- **Data:** `api.landing.connectionMap()` → `ConnectionMap` data.

### 10 · IntegrationShowcase — `sections/integration-showcase.tsx`  ·  **client**
- **Why client:** Radix Tabs interactivity.
- **Props:** `{ heading: SectionHeadingData; tabs: IntegrationTab[] }` where each tab is `{ key: "github" | "discord" | "calendar" | "email" | "groq"; label: string; body: string; bullets: string[] }`.
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, **`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`** (existing `@/components/ui/tabs`), `BrandIcon` (github/discord/calendar), `Card`.
- **Icons:** `Mail` (email), `Bot`/`Sparkles` (Groq) — providers without a `/public` logo use lucide; GitHub/Discord/Calendar use `BrandIcon`.
- **Viz:** tab panels with per-integration mock snippet.
- **Data:** `api.landing.integrations()` → `IntegrationTab[]`.

### 11 · LearningBuilding — `sections/learning-building.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; columns: { icon: LucideName; title: string; body: string }[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `Card`, `Separator`.
- **Icons:** `BookOpen`, `Wrench`, `Repeat`.
- **Viz:** none (two/three-column narrative — learning ⇄ building loop).
- **Data:** `api.landing.learningBuilding()` → `LearningBuilding`.

### 12 · Analytics — `sections/analytics-section.tsx`  ·  **server** (client child)
- **Props:** `{ heading: SectionHeadingData; charts: { title: string; series: ChartPoint[]; kind?: "bar" \| "line"; suffix?: string }[]; kpis: { value: string; label: string }[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `AnimatedChart` (client), `Stat`, `Card`.
- **Icons:** `TrendingUp`, `Activity`, `PieChart`.
- **Viz:** `AnimatedChart` motion bars/lines that grow on inView + KPI `Stat`s.
- **Data:** `api.landing.analytics()` → `AnalyticsBlock` (may derive from existing `api.driveHealth()` fixture shape).

### 13 · SecurityGovernance — `sections/security-governance.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; items: { icon: LucideName; title: string; body: string }[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `Card`, `Badge` (app ui).
- **Icons:** `ShieldCheck`, `Lock`, `KeyRound`, `ScrollText` (audit), `Fingerprint` (Google OAuth).
- **Viz:** none (assurance card grid — RBAC, Google-OAuth-only, audit log, account isolation).
- **Data:** `api.landing.security()` → `SecurityBlock`.

### 14 · PlatformArchitecture — `sections/platform-architecture.tsx`  ·  **server**
- **Props:** `{ heading: SectionHeadingData; layers: ArchLayer[] }`
- **Reuses:** `Section`, `SectionHeading`, `Reveal`, `LayeredDiagram` (server SVG).
- **Icons:** `Cloud`, `Server`, `Database`, `Network`.
- **Viz:** `LayeredDiagram` layered topology (Cloudflare → ALB → ECS client+server → RDS/Redis) — mirrors the deployment topology in the root `CLAUDE.md`.
- **Data:** `api.landing.architecture()` → `ArchLayer[]`.

### 15 · CtaSection — `sections/cta-section.tsx`  ·  **server**
- **Props:** `{ headline: string; sub: string; primaryCta: { label: string; href: string }; secondaryCta?: { label: string; href: string } }`
- **Reuses:** `Section`, `GradientText`, `Reveal`, `Button` (asChild).
- **Icons:** `ArrowRight`, `Sparkles`.
- **Viz:** subtle on-token gradient panel; no diagram.
- **Data:** `api.landing.cta()` → `LandingCta`.

---

## 6. Dependency / import diagram (text)

```
app/(marketing)/layout.tsx  (server)
  ├─ components/landing/shared/marketing-nav.tsx     (client)  → ui/button, lucide(Menu,X)
  ├─ { children }
  └─ components/landing/shared/marketing-footer.tsx  (server)  → ui/separator, integrations/brand-icon, lucide

app/(marketing)/page.tsx    (server)
  └─ components/landing/landing-page.tsx             (server)
       │   const [hero, why, …] = await Promise.all([api.landing.hero(), …])   ← ONLY data boundary
       │
       ├─ sections/hero-section.tsx            (client) → shared/{section,gradient-text,stat,reveal} · ui/button
       │                                                  · viz/ecosystem-hero(client) · viz/contribution-graph
       ├─ sections/why-forge.tsx               (server) → shared/{section,section-heading,reveal,stat} · ui/card
       ├─ sections/ecosystem-flow.tsx          (server) → shared/{section,section-heading,reveal} · viz/node-link-diagram(client)
       ├─ sections/ai-domain-workflow.tsx      (server) → shared/{…} · ui/card · viz/contribution-graph · integrations/brand-icon
       ├─ sections/project-lifecycle.tsx       (server) → shared/{…} · viz/pipeline-flow(client)
       ├─ sections/mentor-experience.tsx       (server) → shared/{…,mock-frame} · dashboard/{stat-card,bar-chart,status-badge} · ui/table
       ├─ sections/teacher-experience.tsx      (server) → shared/{…,mock-frame} · dashboard/{bar-chart,stat-card}
       ├─ sections/mentee-experience.tsx       (server) → shared/{…,mock-frame} · ui/progress · dashboard/status-badge · viz/contribution-graph
       ├─ sections/connected-ecosystem.tsx     (server) → shared/{…} · viz/connection-map(client) · integrations/brand-icon
       ├─ sections/integration-showcase.tsx    (client) → shared/{…} · ui/tabs · ui/card · integrations/brand-icon · lucide(Mail,Bot)
       ├─ sections/learning-building.tsx       (server) → shared/{…} · ui/{card,separator}
       ├─ sections/analytics-section.tsx       (server) → shared/{…,stat} · viz/animated-chart(client) · ui/card
       ├─ sections/security-governance.tsx     (server) → shared/{…} · ui/{card,badge}
       ├─ sections/platform-architecture.tsx   (server) → shared/{…} · viz/layered-diagram(server)
       └─ sections/cta-section.tsx             (server) → shared/{section,gradient-text,reveal} · ui/button

shared primitives  → @/lib/utils(cn) only (+ Reveal/MarketingNav also "use client" + motion)
all viz            → @/lib/utils(cn); animated ones → motion + useReducedMotion
data               → @/lib/api  →  @/lib/mock/landing.ts (via the api seam)  [components NEVER import mock directly]
```

Boundary rule applied: `landing-page.tsx` (server) is the **single place** that calls `api.landing.*`. It passes plain typed data down. Sections are presentational. Client interactivity is isolated to leaf components (`Reveal`, `MarketingNav`, the animated viz, `IntegrationShowcase`) so the rest of the tree streams as RSC.

---

## 7. New shared files to create (checklist)

**Dependency**
- [ ] `npm i motion` (add `motion` to `client/package.json` dependencies)

**Routing / shell**
- [ ] `app/(marketing)/layout.tsx`
- [ ] `app/(marketing)/page.tsx`
- [ ] `app/(marketing)/landing/page.tsx` *(optional alias)*

**Composition**
- [ ] `components/landing/landing-page.tsx`

**Shared primitives** (`components/landing/shared/`)
- [ ] `section.tsx` · `reveal.tsx` *(client)* · `eyebrow.tsx` · `section-heading.tsx` · `gradient-text.tsx` · `stat.tsx` · `mock-frame.tsx` · `marketing-nav.tsx` *(client)* · `marketing-footer.tsx`

**Visualizations** (`components/landing/viz/`)
- [ ] `ecosystem-hero.tsx` *(client)* · `contribution-graph.tsx` · `node-link-diagram.tsx` *(client)* · `pipeline-flow.tsx` *(client)* · `connection-map.tsx` *(client)* · `layered-diagram.tsx` · `animated-chart.tsx` *(client)*

**Sections** (`components/landing/sections/`) — 15 files per §5.

**Data**
- [ ] `lib/mock/landing.ts` (typed fixtures)
- [ ] edit `lib/api/index.ts` to add the `api.landing` accessor group + re-export landing types

**Tests** (co-located, Vitest + Testing Library — match repo convention)
- [ ] `section-heading.test.tsx`, `reveal.test.tsx` (reduced-motion path), `mock-frame.test.tsx`, `integration-showcase.test.tsx` (tab switching), and a smoke test that `landing-page.tsx` renders all 15 sections.

---

## 8. Mock data fixtures

All landing copy/data lives in **one** fixture module and is surfaced through the API seam — components must read via `@/lib/api`, never import the mock module (DIP rule in `client/CLAUDE.md`).

### `lib/mock/landing.ts` — typed fixtures + types

```ts
// Shared
export type LucideName = string;                       // resolved to an icon by the section via a small icon map
export interface SectionHeadingData { eyebrow?: string; title: string; lead?: string }
export interface FeatureItem { icon: LucideName; title: string; body: string }

// Viz primitives
export interface ContributionWeek { days: number[] }                 // 7 intensities 0–4
export interface GraphNode { id: string; label: string; icon?: LucideName; x: number; y: number; kind: "role" | "domain" | "provider" }
export interface GraphEdge { from: string; to: string }
export interface EcosystemGraph { nodes: GraphNode[]; edges: GraphEdge[] }
export interface PipelineStage { id: string; label: string; icon: LucideName; detail: string }
export interface MapNode { id: string; label: string; icon?: LucideName; brand?: "github" | "discord" | "calendar" }
export interface ConnectionMapData { hub: MapNode; endpoints: MapNode[] }
export interface ArchLayer { id: string; label: string; nodes: string[]; tone?: "primary" | "neutral" }
export interface ChartPoint { label: string; value: number }

// Section payloads
export interface LandingHero { headline: string; sub: string; stats: { value: string; label: string }[]; primaryCta: { label: string; href: string }; secondaryCta?: { label: string; href: string }; contributionWeeks: ContributionWeek[] }
export interface WhyForge { heading: SectionHeadingData; pillars: FeatureItem[]; stats?: { value: string; label: string }[] }
export interface Lifecycle { heading: SectionHeadingData; stages: PipelineStage[] }
export interface MentorMock { /* stat tiles, a task table row[], a small bar series */ }
export interface TeacherMock { /* domain bar series + cohort stats */ }
export interface MenteeMock { /* tasks, progress %, contributionWeeks */ }
export interface IntegrationTab { key: "github" | "discord" | "calendar" | "email" | "groq"; label: string; body: string; bullets: string[] }
export interface LearningBuilding { heading: SectionHeadingData; columns: FeatureItem[] }
export interface AnalyticsBlock { heading: SectionHeadingData; charts: { title: string; series: ChartPoint[]; kind?: "bar" | "line"; suffix?: string }[]; kpis: { value: string; label: string }[] }
export interface SecurityBlock { heading: SectionHeadingData; items: FeatureItem[] }
export interface LandingCta { headline: string; sub: string; primaryCta: { label: string; href: string }; secondaryCta?: { label: string; href: string } }

// Exported fixtures (one const each): LANDING_HERO, WHY_FORGE, ECOSYSTEM_GRAPH,
// AI_WORKFLOW, LIFECYCLE, MENTOR_MOCK, TEACHER_MOCK, MENTEE_MOCK, INTEGRATION_TABS,
// LEARNING_BUILDING, ANALYTICS_BLOCK, SECURITY_BLOCK, ARCH_LAYERS, LANDING_CTA
```

> `icon` fields carry **string names**, not React nodes — keep fixtures serializable and free of JSX. Each section maps the name to a `lucide-react` icon via a tiny local `Record<LucideName, LucideIcon>`. This keeps deep components from hardcoding copy/icons and keeps the data layer pure.

### `lib/api/index.ts` — add the accessor group

```ts
import * as landing from "@/lib/mock/landing";
export * from "@/lib/mock/landing";   // re-export landing types (the seam)

export const api = {
  // …existing accessors…
  landing: {
    hero:           () => get("/landing/hero", landing.LANDING_HERO),
    whyForge:       () => get("/landing/why", landing.WHY_FORGE),
    ecosystemGraph: () => get("/landing/ecosystem", landing.ECOSYSTEM_GRAPH),
    aiWorkflow:     () => get("/landing/ai-workflow", landing.AI_WORKFLOW),
    lifecycle:      () => get("/landing/lifecycle", landing.LIFECYCLE),
    mentorMock:     () => get("/landing/mentor", landing.MENTOR_MOCK),
    teacherMock:    () => get("/landing/teacher", landing.TEACHER_MOCK),
    menteeMock:     () => get("/landing/mentee", landing.MENTEE_MOCK),
    integrations:   () => get("/landing/integrations", landing.INTEGRATION_TABS),
    learningBuilding: () => get("/landing/learning", landing.LEARNING_BUILDING),
    analytics:      () => get("/landing/analytics", landing.ANALYTICS_BLOCK),
    security:       () => get("/landing/security", landing.SECURITY_BLOCK),
    architecture:   () => get("/landing/architecture", landing.ARCH_LAYERS),
    cta:            () => get("/landing/cta", landing.LANDING_CTA),
  },
};
```

In presentation mode these resolve fixtures synchronously-ish (`get` returns the fixture); in production they would `fetch` the backend — **no call-site change**, exactly like the existing accessors.

---

## 9. Build order

1. **Dependency:** `npm i motion`.
2. **Data seam:** `lib/mock/landing.ts` (types + fixtures) → wire `api.landing.*` in `lib/api/index.ts`. (Unblocks everything; lets sections be typed against real shapes.)
3. **Shell:** `(marketing)/layout.tsx` + `MarketingNav` + `MarketingFooter`, and `(marketing)/page.tsx` rendering an empty `LandingPage`. Verify the route renders full-bleed with no app sidebar.
4. **Shared primitives:** `Section`, `Eyebrow`, `SectionHeading`, `GradientText`, `Stat`, `MockFrame`, then `Reveal` (client, with reduced-motion). Add tests for `SectionHeading`/`Reveal`/`MockFrame`.
5. **Static sections (no viz):** 2 WhyForge, 11 LearningBuilding, 13 SecurityGovernance, 15 CtaSection — fastest to land and validate the visual language.
6. **MockFrame role sections:** 6 Mentor, 7 Teacher, 8 Mentee — reuse app `StatCard`/`BarChart`/`StatusBadge`/`Table`/`Progress` inside `MockFrame`.
7. **Static-SVG viz:** `ContributionGraph` + `LayeredDiagram`; ship sections 4 AiDomainWorkflow and 14 PlatformArchitecture.
8. **Animated viz:** `PipelineFlow` (5), `NodeLinkDiagram` (3), `ConnectionMap` (9), `AnimatedChart` (12) — each behind `prefers-reduced-motion` fallbacks.
9. **Hero last (heaviest):** `EcosystemHero` canvas + `HeroSection` (1), composing the now-proven primitives.
10. **IntegrationShowcase (10):** Radix `Tabs` panels.
11. **Compose + polish:** finalize ordering in `landing-page.tsx`, the smoke test asserting all 15 sections render, responsive pass, a11y pass (focus order, ARIA on icon-only nav buttons, contrast), reduced-motion QA.

---

## 10. Conventions honored (quick audit)

- RSC by default; `"use client"` only on `Reveal`, `MarketingNav`, `HeroSection`, `IntegrationShowcase`, and animated viz.
- `cn()` everywhere; styling from `@theme` tokens (`bg-primary`, `text-muted-foreground`, `border-border`) — gradients via `color-mix` of tokens, no raw hex.
- `lucide-react` for UI icons; `BrandIcon` from `/public` for GitHub/Discord/Calendar logos.
- Data only through `@/lib/api` (`api.landing.*`); the mock module is never imported by components.
- Radix `Tabs` reused from `@/components/ui/tabs` for IntegrationShowcase.
- App primitives (`StatCard`, `BarChart`, `StatusBadge`, `Table`, `Progress`, `Card`, `Badge`, `Separator`, `Button`) reused rather than re-implemented.
- Accessibility + reduced-motion fallbacks built into `Reveal` and every animated viz; co-located Vitest tests.
