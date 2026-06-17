# Forge — Landing Page Design Rationale

**Owner:** Learner Career Council (LCC), Newton School of Technology (NST)
**Surface:** Public marketing landing page for **Forge**
**Status:** Design source of truth for the marketing page (not the in-app product). When the page changes, update this file in the same change.

> This document is the **complete design rationale** for the Forge marketing landing page — vision, audiences, voice, visual language, the section-by-section intent, and the accessibility/performance/SEO/motion strategy. It is deliberately opinionated. It is **not** a component spec and it does **not** override `portal/CLAUDE.md` or `portal/client/CLAUDE.md` for any in-app surface. Where the two could appear to conflict (a *premium animated marketing page* vs. the *no-gradient, dense Jira/Linear app*), Section 6 resolves it explicitly: the landing page is a distinct surface with its own permission to be expressive, anchored to the same brand tokens.

---

## 1. What Forge is (the one paragraph everything serves)

Forge is built by the **Learner Career Council (LCC)** at **Newton School of Technology (NST)**. It is a multi-domain (**AI / ML / SDSE**) university **Profile Building Drive** platform where **Students build, Mentors guide, Teachers track, and learning becomes measurable through real GitHub contribution.** The Student **Mentor leads their team** (there is no separate Team Lead). Work flows the way real engineering works — Issue → Self-assign → Branch → Development → Pull Request → Review → Merge → Milestone — and is observed, not invented, through HMAC-verified GitHub webhooks, layered reviews (L1–L4), and a connected set of server-side integrations (GitHub, Discord, Google Calendar, Email, Groq AI).

The landing page exists to make a visitor *feel* that this is real engineering made visible — and then to convert the right person into "I want in."

---

## 2. Vision & positioning

**Positioning statement.** Forge is *the university drive where profiles are built by shipping, not by claiming.* The competitive contrast we lean on (implicitly, never by naming competitors): résumés and certificates assert skill; **Forge demonstrates it** through a verifiable contribution trail — commits, PRs, reviews, milestones — attributed to a real person by a stable GitHub id.

**Three positioning pillars** the whole page must reinforce:

1. **Real contribution, not coursework theatre.** The activity spine is GitHub. Nothing is self-reported into existence; it arrives via webhooks and is matched to the right user. This is the credibility anchor.
2. **A guided ecosystem, not a lonely grind.** Mentors lead teams, Teachers track domains, the LCC governs the drive. Learning is scaffolded by people, with AI (Groq) *assisting* mentors — never replacing them.
3. **Measurable and governed.** Reviews L1–L4, auto-flags, RBAC, audit logs, domain/team isolation. Forge is something a university can trust and a recruiter can believe.

**What the page is NOT:** a feature dump, a generic SaaS template, a gamified leaderboard, or a clone of the in-app dashboard. It is a *premium marketing narrative* that earns trust and ends in a single clear action.

---

## 3. Target audiences and what each must grasp

The page is read top-to-bottom by very different people. The narrative is ordered so each audience reaches *their* proof before they bounce. Every section below is tagged with its primary audience in Section 10.

| Audience | What they arrive skeptical about | What they must grasp (and where) | Their conversion |
|---|---|---|---|
| **University leadership / NST stakeholders** | "Is this rigorous, safe, and governable?" | Forge is governed: RBAC in 3 server-side layers, Google-only invite auth, immutable audit, domain/team isolation, AWS isolation. (§13, §14) | Endorse / fund / mandate the drive |
| **LCC (internal owners)** | "Does this represent us well and scale across AI/ML/SDSE?" | Multi-domain by design; the LCC governs the drive; the ecosystem story is coherent. (§3, §9, §12) | Champion and operate it |
| **Teachers** | "Will I actually *see* what's happening across my domains without drowning?" | Track many teams across domains; L4 decisions; auto-flags surface risk early. A Teacher may span multiple domains. (§7, §12) | Adopt and oversee |
| **Mentors (student leaders)** | "Can I lead my team and prove my own leadership?" | The Mentor *leads* the team, runs L2/L3, connects GitHub in one click, gets Groq-assisted summaries. (§6, §10) | Lead a team, link GitHub |
| **Students / Mentees** | "Will this build something real I can show?" | Daily L1 updates, real PRs and reviews, a visible contribution profile that compounds. (§8, §11) | Join, contribute, build a profile |

**Design implication:** trust artifacts (security, governance, architecture) cannot be buried at the very bottom only — leadership scans fast. We surface a *governance reassurance* visually early (a quiet "Invite-only · Google SSO · Audited" trust strip near the hero) and pay it off in full at §13–§14.

---

## 4. Brand voice

**Voice:** confident, precise, builder-to-builder. We write like senior engineers who respect the reader's time. **Tense:** active and present ("Mentors lead. Teachers track. Students ship."). **Person:** second person for students/mentors ("you"), third person for governance ("the LCC governs the drive").

**Do**

- Use the platform's real nouns: *Issue, Branch, Pull Request, Review, Merge, Milestone, L1–L4, mentee update, auto-flag, domain, team.* Specificity is the brand.
- Lead with verbs that mean shipping: *build, ship, review, merge, contribute, lead, track.*
- Name **Forge**, **LCC**, and **NST** explicitly and proudly.
- Quantify where honest ("five roles," "four review levels," "three domains," "every event HMAC-verified").

**Don't**

- No hype adjectives without a mechanism behind them ("revolutionary," "next-gen," "AI-powered" as a standalone claim). If we say "AI insights," the next clause says *Groq, assisting mentors, never replacing them.*
- No fake urgency, no growth-hack dark patterns, no exclamation spam.
- Never imply AI grades students or replaces a mentor. Never imply self-signup ("Get started free!" is wrong — it's **invite-only**).

**Tagline / closer (canonical):** *"Join the ecosystem. Build. Learn. Contribute."*

---

## 5. Visual language

The landing page is a **premium marketing surface** that stays unmistakably *Forge*. It borrows the brand's DNA from the app — **indigo `#4f46e5` accent on zinc grays** — but it is allowed depth, motion, and atmosphere the dense app is not. The rule that keeps it coherent: **the brand tokens are shared; the *permission to be expressive* is not.**

### 5.1 Color

- **Foundation:** zinc neutrals. Light sections on `zinc-50`/white; "premium" sections (hero, integration showcase, CTA) on a deep `zinc-950`/near-black canvas. The dark canvas is the single biggest signal that this is *marketing*, not the white app.
- **Accent:** indigo `#4f46e5` is the only chromatic accent, exactly as in-app. It marks the active state, the focal node in a diagram, the primary CTA, and key data points.
- **Status colors** (emerald / amber / rose) appear **only** where they carry real product meaning — the L1–L4 status chips (`DOING_WELL` 🟢 / `NEEDS_CONSISTENCY` 🟡 / `NO_UPDATES` 🔴) and auto-flags. They are quoted from the product, not decorative.
- **Gradients — the deliberate exception:** the app forbids gradients; the landing page permits **restrained indigo-into-zinc gradients and radial glows on the dark canvas only** (hero backdrop, network-viz vignette, CTA). They are atmospheric depth, never applied to text, cards, buttons, or any element that mirrors an in-app component. This is a conscious, bounded divergence — see §6.
- **Provider brand colors** (GitHub black, Discord `#5865F2`, Google Calendar green, Groq) appear **only** inside the Integration Showcase tabs, sourced from the brand-icon set, never recolored.

### 5.2 Typography

- One sans family (the app's system/Inter stack) across both surfaces — continuity.
- **Marketing gets a larger type ramp than the app:** display headings `clamp(2.5rem → 4.5rem)` with tight tracking (`-0.02em`), versus the app's restrained `19–25px` headings. Big type is how a marketing page earns presence without gradients-everywhere.
- Body copy stays calm: `text-base`/`text-lg`, zinc-600 on light, zinc-300/400 on dark, generous `leading-relaxed`, measure capped near `65ch`.
- Monospace (`ui-monospace`) for anything that is literally code or config — repo paths, event names (`pull_request_review`), env-ish labels. It signals "this is real engineering" and ties back to the setup docs' aesthetic.

### 5.3 Spacing, depth & borders

- **Generous vertical rhythm.** Sections breathe at `py-24 → py-32`; the dense app packs data, the landing page paces a story. White space is a feature here, not waste.
- **Borders over shadows — inherited, then relaxed.** The app uses 1px zinc borders, not shadows. The landing page keeps 1px borders as the default card treatment (continuity), but on the dark canvas permits **soft, low-spread shadows and subtle inner glows** for elevation that reads as premium. No glassmorphism, no heavy drop shadows, no neon.
- **Radii:** consistent with the app's modest rounding (`rounded-lg`/`rounded-xl`); hero/feature cards may go to `rounded-2xl`. Nothing pill-shaped except genuine badges/chips quoted from the product.

### 5.4 Motion philosophy

Motion exists to **explain flow and reward scrolling**, never to decorate. Forge's core idea is *movement of work through a pipeline* — so motion is literal narrative: an Issue becomes a Branch becomes a PR becomes a Merge.

- **Library:** `motion` (Framer Motion) for scroll-reveal, staggered entrances, and micro-interactions; **SVG + Canvas + CSS** for the network/ecosystem/contribution visualizations. **No three.js in v1** — 2D vector and canvas only, for weight and accessibility.
- **Principles:** short durations (`150–500ms`), eased (`ease-out` for entrances), small displacements (`8–24px`, never whole-screen slides), one focal animation per viewport. Reveal-once (no replay loops on scroll-back) to avoid nausea and CPU churn.
- **Signature motions:** (1) the **pipeline** — nodes light up indigo in sequence along the lifecycle; (2) the **ecosystem network** — Teacher→Mentors→Teams→Repos drawn as a settling force-directed graph that comes to rest, not a perpetual idle wobble; (3) the **contribution canvas** — a GitHub-style activity field that fills on enter.
- **Degradation is a first-class state, not an afterthought** — see §9.

---

## 6. Resolving the tension: "premium animated marketing" vs. "no-gradient, dense app"

This is the central design decision, stated plainly so no one re-litigates it in code review.

**The apparent conflict.** `client/CLAUDE.md` mandates a Jira/Linear language: white surfaces, 1px borders not shadows, one indigo accent, *no gradients, no glassmorphism, no gaming UI.* The brief for this page asks for a *premium, animated, atmospheric marketing surface.* Read naively, those collide.

**The resolution — they are two different surfaces with one brand.**

1. **Scope boundary.** The `client/CLAUDE.md` design rules govern the **authenticated product** (`app/(app)/**`), where density, scannability, and zero-distraction data work are the job. The **public marketing page** is a separate surface with a separate job: persuade and build trust. The dense-app rules are not loosened *inside the app*; the marketing page simply isn't bound by them.
2. **Shared tokens, divergent permissions.** Both surfaces draw from the **same `@theme` tokens** — identical indigo `#4f46e5`, identical zinc ramp, same type family. The *atoms* match so the brand reads as one. What differs is **permission**: the marketing page may use a dark canvas, large display type, bounded indigo→zinc gradients/glows, and scroll motion; the app may not.
3. **Bounded divergence, written down.** Gradients/glows are allowed **only** on dark marketing canvases and **only** as background atmosphere — never on text, buttons, cards, badges, or anything that visually quotes an in-app component. When the page shows a *product-style artifact* (a status chip, a mini table, a review card), it renders it in **strict app style** — white, 1px border, flat — precisely so the contrast reads as "this is the real, serious product." The marketing chrome frames; the product fragments stay honest.
4. **The test.** For any element ask: *"Does this look like it belongs inside the dashboard?"* If yes → it must obey app rules (flat, bordered, no gradient). If it's clearly marketing chrome (hero, section background, CTA, network viz) → expressive treatment is allowed within §5. This single question prevents drift in both directions.

Net: the page feels **premium and alive**, yet every time it shows you the actual product it snaps to the disciplined Jira/Linear look — which is itself a selling point.

---

## 7. Information architecture & narrative arc

The 15 canonical sections form a deliberate arc: **hook → why → how it works → proof of realness → the people → the connective tissue → the differentiator → trust → ask.**

`Hero (hook)` → `Why Forge exists (problem)` → `Ecosystem (the model)` → `AI Domain Workflow (the proof it's real)` → `Project Lifecycle (the mechanism)` → `Mentor / Teacher / Mentee (the people)` → `Connected Ecosystem + Integration Showcase (the connective tissue)` → `Learning + Building (the differentiator)` → `Analytics (the payoff)` → `Security + Architecture (the trust)` → `CTA (the ask)`.

Tension and release alternate by canvas: **dark** (hero) → light (why) → light (ecosystem) → **dark** (AI workflow) → light (lifecycle) → light (personas) → **dark** (integration showcase) → light (learning) → light (analytics) → light (security/arch) → **dark** (CTA). The dark sections are the emotional beats; the light sections are the rational ones.

---

## 8. SEO, metadata & semantics

- **RSC by default.** The entire page is server-rendered for SEO and first paint; `"use client"` is scoped to the islands that actually animate or hold tab state (network viz, integration showcase, lifecycle stepper). No client-side data fetching for content — all copy ships in the initial HTML.
- **Title / meta:** `Forge — Build. Learn. Contribute. | NST Learner Career Council`. Meta description leads with the value prop and names NST + LCC. Open Graph + Twitter card with a rendered hero image.
- **Structured data:** JSON-LD `Organization` (Newton School of Technology / Learner Career Council) and `SoftwareApplication`/`WebSite` for Forge, so the platform, its maker, and the university are machine-legible.
- **Semantic HTML:** one `<h1>` (hero), section `<h2>`s in canonical order, `<nav>`/`<main>`/`<section>`/`<footer>` landmarks, real heading hierarchy (no skipped levels), descriptive `alt` text on every diagram, and `<figure>`/`<figcaption>` for the visualizations.
- **Performance is SEO:** Core Web Vitals are budgeted in §11. Fast pages rank; an animation-heavy page that fails LCP/INP/CLS undermines its own discoverability.

---

## 9. Accessibility & graceful motion degradation

Accessibility is non-negotiable and mirrors the app's commitments (keyboard nav, visible focus, ARIA on icon-only controls, sufficient contrast).

- **`prefers-reduced-motion: reduce` is honored everywhere.** Every `motion` animation reads the user's preference. Reduced-motion users get the **final, settled state instantly** — the network graph renders already-arranged, the pipeline shows all nodes lit, reveals become simple opacity fades or nothing. No parallax, no autoplay, no continuous loops. The page is **fully comprehensible with zero motion** because motion only ever *reorders the reveal* of content that is already present in the DOM.
- **Contrast:** indigo `#4f46e5` on white and on `zinc-950` both clear WCAG AA for the sizes used; body text targets AA (≥4.5:1), large display targets ≥3:1. We verify, not assume — light text on the dark canvas uses `zinc-200/300`, not `zinc-500`.
- **Keyboard & focus:** the Integration Showcase tabs are a real Radix tablist (arrow-key navigable, `aria-selected`, roving tabindex); the lifecycle stepper is operable without a pointer; visible focus rings (indigo) on every interactive element.
- **Screen readers:** decorative canvas/SVG marked `aria-hidden`; the *meaning* it conveys is also available as text or an accessible label, so nothing is animation-only.
- **No seizure risk:** no flashing > 3Hz, no high-contrast strobe; node "lighting" eases gently.
- **Canvas fallback:** if Canvas/WebGL-style rendering is unavailable, the contribution viz degrades to a static SVG or a simple bordered stat block.

---

## 10. Performance strategy

| Concern | Strategy |
|---|---|
| **First load** | RSC server-render; ship minimal client JS. Animations hydrate as small client islands, not a page-wide client tree. |
| **Motion cost** | Animate only `transform` and `opacity` (GPU-friendly); never animate layout/`width`/`top`. Reveal-once; pause off-screen via `IntersectionObserver`. |
| **Network viz** | Capped node count; precomputed/settling layout (not an unbounded live simulation); `requestAnimationFrame` with a frame budget; stop ticking once at rest. |
| **Assets** | Provider logos as inline SVG via the brand-icon component; hero/OG raster images in modern formats with explicit `width`/`height` (no CLS); fonts `display: swap`, subset, preloaded. |
| **Budgets (targets)** | LCP < 2.5s, INP < 200ms, CLS < 0.1; JS for the marketing route kept lean; no blocking third-party scripts. |
| **Responsiveness** | Mobile-first; heavy visualizations gracefully simplify on small/low-power devices (fewer nodes, static fallbacks); tap targets ≥ 44px. |

---

## 11. Section-by-section design intent

Order is canonical and fixed. "Canvas" = light (white/`zinc-50`) or dark (`zinc-950`). "Motion" lists the signature interaction; all degrade per §9. "Audience" is the primary reader served.

| # | Section | Primary audience | Canvas | Design intent & content | Signature motion |
|---|---|---|---|---|---|
| 1 | **Hero** | Everyone (esp. students) | Dark | One-line promise + the closer DNA: *Build. Learn. Contribute.* Subhead names Forge, LCC, NST. Primary CTA + quiet trust strip ("Invite-only · Google SSO · Audited"). Restrained indigo→zinc radial glow. | Headline staggered reveal; faint ambient node field settling behind |
| 2 | **Why Forge exists** | Leadership, students | Light | The problem: profiles are *claimed*, not *proven*. Forge makes contribution the unit of truth. Calm, prose-led, big type, no diagram. | Scroll-reveal of the thesis line |
| 3 | **How the ecosystem works** | LCC, teachers | Light | The model: **Teacher → Mentors → Teams → Repos → Issues → PRs → Reviews → Learning.** Horizontal flow diagram; Mentor labeled as *team lead*. Five roles named. | Animated connectors drawing left→right |
| 4 | **AI Domain Workflow** | Students, mentors | Dark | The realness proof: **GitHub Org (`newton-school-ai`) → Teams → Repos → Issues → PRs → Mentor Reviews → Progress.** Shows GitHub *is* the source of truth for AI; webhooks attribute by stable id. | Pipeline nodes light indigo in sequence |
| 5 | **Project Lifecycle** | Students, mentors | Light | The mechanism, in product nouns: **Issue → Self-assign → Branch → Development → Pull Request → Review → Merge → Milestone.** Interactive stepper; each step a real GitHub action. | Stepper advance; active step indigo |
| 6 | **Mentor experience** | Mentors | Light | The Mentor *leads* the team. L2 status, L3 weekly review, one-click "Connect with GitHub," Groq-assisted summaries that assist (never replace). Show a flat, app-style review card. | Reveal of mentor dashboard fragment |
| 7 | **Teacher experience** | Teachers | Light | Track across **multiple domains**; L4 decisions (Continue / Monitor / Schedule discussion); auto-flags (consistency gap, repeated blocker, no updates) surface risk early. | Domain filter chips animate in |
| 8 | **Mentee experience** | Students | Light | Daily L1 update (worked on / learning / blocker / next goal); real PRs reviewed by your mentor; a profile that compounds. Encouraging, first-person. | Activity entries cascade in |
| 9 | **The Connected Learning Ecosystem** | Leadership, LCC | Dark | Integrations overview as the connective tissue: GitHub (spine), Discord (comms), Calendar (time), Email (reach), Groq (insight) — **all server-side**. Force-directed network with Forge at center. | Network graph settles to rest |
| 10 | **Interactive Integration Showcase** | Mentors, leadership | Dark | Radix tablist: **GitHub / Discord / Calendar / Email / Groq.** Each tab: what it does, what flows through it, why it's safe (HMAC, server-only, no per-user tokens). Provider brand colors only here. | Tab cross-fade; per-tab micro-viz |
| 11 | **Learning + Building** | Students, leadership | Light | The differentiator: you don't choose between learning and shipping — at Forge, **building *is* the learning**, measured by real contribution. The emotional core, prose-led. | Single focal reveal |
| 12 | **Analytics & Visibility** | Teachers, leadership | Light | The payoff of measurement: contribution insights, progress analysis, review rollups, auto-flags. Render app-style charts/tables (flat, bordered) — the "snap to product" moment. | Bars/sparklines grow on enter |
| 13 | **Security & Governance** | Leadership, NST | Light | Trust, in full: Google OAuth only (rishihood/NST hosted-domain + admin allowlist, invite-only, no self-signup), Redis sessions + opaque cookie, CSRF, RBAC in 3 server-side layers, domain/team isolation, immutable audit log. | Quiet checklist reveal |
| 14 | **Platform Architecture** | Leadership, technical eval | Light | client (Next.js 16, UI-only) → server (Node/Express/TS, all logic + integrations + webhooks) → PostgreSQL (Prisma 7) + Redis; AWS ECS Fargate, ALB, Cloudflare, RDS, ElastiCache, Secrets Manager. Clean labeled diagram. | Layered diagram assembles |
| 15 | **CTA** | Everyone | Dark | The ask: *"Join the ecosystem. Build. Learn. Contribute."* Single primary action; restate invite-only (sign in with Google). LCC/NST footer. | CTA glow pulse (reduced-motion: static) |

---

## 12. Cross-cutting content rules (so the page never lies)

- **Always "invite-only."** No "sign up," no "create account." The action is "Sign in with Google" / "Request access from the LCC." Auth is Google OAuth only, NST/rishihood hosted-domain + admin allowlist.
- **AI assists, never grades.** Any Groq mention is paired with "assists mentors, never replaces them."
- **Five roles, Mentor leads.** Admin · LCC · Teacher · Mentor · Mentee. Never invent a "Team Lead" — the Student Mentor leads the team. A Teacher may span multiple domains.
- **GitHub is observed, not claimed.** Activity arrives via HMAC-verified webhooks (AI org webhook; ML/SDSE per-repo webhooks reusing one secret), matched by stable GitHub id. No GitHub App, no per-user tokens stored.
- **Server owns everything.** If the page describes a capability, it's a server capability; the client is UI only. Don't imply the browser talks to GitHub/Discord/Google/Groq.
- **Three domains, named.** AI / ML / SDSE — AI on a real org, ML/SDSE on per-repo webhooks. The page should make the multi-domain story explicit, not generic.

---

## 13. Definition of done (design)

The landing page is "done" when:

1. All **15 canonical sections** are present in order, each meeting its §11 intent.
2. **Forge, LCC, and NST** are each named explicitly and correctly.
3. The page is **fully comprehensible with motion disabled** (`prefers-reduced-motion`) and via keyboard + screen reader.
4. Every *product-style* fragment renders in **strict app style** (flat, 1px border, no gradient); expressive treatment appears only on marketing chrome (the §6 test passes for every element).
5. Color stays within **indigo `#4f46e5` + zinc**, with status/provider colors only where they carry product meaning.
6. **Core Web Vitals budgets** (§10) are met on mid-range mobile.
7. No claim violates §12 (invite-only, AI-assists, Mentor-leads, server-owns, webhook-observed).
8. Content ships **server-rendered** with correct metadata, JSON-LD, and semantic landmarks (§8).

---

*Forge · a Profile Building Drive by the Learner Career Council (LCC) at Newton School of Technology (NST). Build. Learn. Contribute.*
