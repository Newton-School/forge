# Forge Landing Page — Animation & Motion Strategy

> Detailed, implementation-ready motion plan for the **Forge** marketing landing page.
> Stack: **Next.js 16** (App Router, Turbopack, Server Components by default) · **React 19** · **Tailwind v4** (`@theme` tokens in `app/globals.css`) · **`motion`** (Framer Motion v11) for scroll / reveal / micro-interactions · **SVG + Canvas 2D + CSS** for visualizations. **No three.js in v1** (noted as a future option for the hero node-field — a WebGL particle system behind a feature flag).
>
> Forge is the Learner Career Council (LCC) Profile Building Drive platform at the Newton School of Technology (NST). Motion here **explains the platform** — students build, mentors guide, teachers track, learning is measured by real GitHub contribution, all stitched together by integrations (GitHub / Discord / Calendar / Email / Groq AI) and a central "Portal" intelligence. Motion is never decoration.

---

## 0. Non-negotiable constraints

1. **Content-first / graceful degradation.** Every section must render fully readable and usable with **JS disabled, `motion` not yet hydrated, or animation off**. Animation only ever changes the *arrival* of already-present content — never its *existence*. Initial opacity is `1` in CSS; the `"use client"` island sets `0` only after mount (see §1.4).
2. **`prefers-reduced-motion` is honored everywhere** via `useReducedMotion()` — reduced motion collapses to instant or opacity-only transitions, ambient loops stop, drifting fields freeze on a static composed frame.
3. **60fps.** Animate **only `transform` and `opacity`** on the compositor. No animating `width`, `height`, `top`, `left`, `margin`, `box-shadow`, `filter` in hot loops.
4. **Server Components stay server.** Animation lives in **small `"use client"` islands** (e.g. `Reveal`, `HeroNodeField`, `CountUp`). The page shell, copy, and layout stay Server Components.
5. **SSR-safe.** No `window`, `document`, `matchMedia`, `IntersectionObserver`, or `requestAnimationFrame` at module scope or during render — only inside `useEffect` / event handlers. Heavy canvas mounts client-side only.
6. **Design language holds.** Motion uses the existing tokens: indigo accent `--primary #4f46e5` (hover `#4338ca`), zinc grays, `--border #e4e4e7`, `--radius 0.5rem`. No gradients, glassmorphism, or gaming flourishes — premium, restrained, Stripe/Vercel/Linear-grade. Status colors (`--success`, `--warning`, `--info`) appear only where the UI itself uses them (e.g. pipeline stage states).

---

## 1. Motion principles & global system

### 1.1 Easing curves (concrete cubic-béziers)

Define once and reuse. Put them in `client/lib/motion/tokens.ts` so every island imports the same values.

```ts
// client/lib/motion/tokens.ts
export const ease = {
  // Standard reveal — gentle deceleration. The default for entrances.
  out:      [0.22, 1, 0.36, 1],   // "easeOutExpo-ish" — confident settle
  // Symmetric — for cross-fades, tab swaps, color/opacity changes.
  inOut:    [0.65, 0, 0.35, 1],
  // Snappy entrance for small UI (badges, chips, count-up tick).
  outBack:  [0.34, 1.56, 0.64, 1], // tiny overshoot — use sparingly, ≤8px
  // Mechanical / linear-ish for "packets" traveling a path and progress fills.
  linearish:[0.4, 0, 0.6, 1],
  // Spring config for hover/press micro-interactions (physical, interruptible).
  spring:   { type: "spring", stiffness: 420, damping: 32, mass: 0.8 },
  springSoft:{ type: "spring", stiffness: 260, damping: 30, mass: 1 },
} as const;
```

| Use case | Curve | Notes |
|---|---|---|
| Section reveals, hero copy | `ease.out` | The workhorse; never `easeIn` for entrances (feels sluggish). |
| Cross-fades, tab/integration swaps | `ease.inOut` | Symmetric so out- and in-going feel balanced. |
| Buttons, cards, chips hover/press | `ease.spring` | Interruptible; survives rapid hover in/out. |
| Stat chips / badge pop | `ease.outBack` | ≤8px overshoot only — easy to overdo. |
| Pipeline fill, traveling packets, line draw | `ease.linearish` | Reads as steady mechanical progress. |

### 1.2 Duration tokens

```ts
export const dur = {
  fast:   0.18,  // micro — hover, press, chip
  base:   0.4,   // standard reveal
  slow:   0.6,   // hero, large composed reveals
  xslow:  0.9,   // line-draw / pipeline fill segments
  ambient:{ drift: 18, pulse: 2.4 }, // seconds — looping hero field
} as const;
```

Rule of thumb: **micro-interactions 120–200ms**, **content reveals 350–600ms**, **storytelling/draw 600–1200ms**, **ambient loops 2–20s**. Never exceed ~1.2s for a discrete reveal — it starts to feel broken.

### 1.3 Distance & stagger tokens

```ts
export const dist = {
  sm: 8,    // chips, inline elements
  md: 16,   // cards, list items (default reveal travel)
  lg: 24,   // section headers, hero lines
} as const;

export const stagger = {
  tight: 0.05,  // dense lists / grid cells
  base:  0.08,  // card grids, feature rows
  loose: 0.12,  // hero lines, big statements
} as const;
```

Reveal travel is **small and always vertical** (`y`, never `x` for body content — horizontal drift reads as "broken layout" on mobile). Cards rise `dist.md` (16px); headers `dist.lg` (24px).

### 1.4 The reusable `Reveal` pattern

A single client island used by ~90% of sections. Built on `whileInView` + variants + `staggerChildren`, reduced-motion aware, and **SSR-safe** (initial visible content; `motion` only adds the transition).

```tsx
// client/components/landing/motion/reveal.tsx
"use client";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ease, dur, dist, stagger } from "@/lib/motion/tokens";

const container = (gap: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: 0.05 } },
});

const item = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
});

export function Reveal({
  children, y = dist.md, gap = stagger.base, once = true, amount = 0.3, asChild, className,
}: {
  children: React.ReactNode; y?: number; gap?: number; once?: boolean;
  amount?: number; asChild?: boolean; className?: string;
}) {
  const reduce = useReducedMotion();
  // Reduced motion: opacity-only, zero travel, no stagger.
  const v = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.001 } } }
    : item(y);
  return (
    <motion.div
      className={className}
      variants={container(reduce ? 0 : gap)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
    >
      {asChild ? children : <motion.div variants={v}>{children}</motion.div>}
    </motion.div>
  );
}

// Child helper for staggered grids/lists — wrap each item.
export function RevealItem({ children, y = dist.md }: { children: React.ReactNode; y?: number }) {
  const reduce = useReducedMotion();
  const v = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.001 } } }
    : item(y);
  return <motion.div variants={v}>{children}</motion.div>;
}
```

Usage:

```tsx
<Reveal gap={stagger.base}>
  {features.map((f) => <RevealItem key={f.id}><FeatureCard {...f} /></RevealItem>)}
</Reveal>
```

- `whileInView` + `viewport={{ once: true }}` fires the reveal once when ~30% enters; the `-10%` bottom margin delays trigger slightly so reveals don't fire while still below the fold.
- For *progress-linked* effects (pipeline fill, line-draw on scroll) use `useScroll` + `useTransform` instead of `whileInView` — see §3.
- For *imperative* control (e.g. start a canvas loop only when visible) use the `useInView` hook with a ref.

### 1.5 Global reduced-motion strategy

One hook, one rule, applied at every island boundary:

```tsx
const reduce = useReducedMotion(); // motion's media-query-backed hook (SSR-safe; false on server)
```

| Animation class | Full motion | Reduced motion |
|---|---|---|
| Reveals (`Reveal`) | y-travel + fade + stagger | opacity-only, no travel, no stagger, ~1ms |
| Count-ups | animated tween 0→N | render final number instantly |
| Hero node field / ambient loops | drift + pulse rAF loop | **paused on a single static composed frame** (still draws once) |
| Line-draw / pipeline fill | `useScroll` progress drives `pathLength`/fill | rendered fully drawn/filled at rest |
| Traveling "packets" | animate along path | hidden (paths shown static) |
| Tab cross-fade | fade + 4px slide | instant swap (display switch) |
| Hover/press springs | spring scale/translate | retained but reduced to ~1.0 scale / no translate |

Reduced motion **never removes information** — it removes *movement*. Final visual states are identical to the end-state of the full animation.

Optional belt-and-suspenders global CSS guard (covers any CSS keyframe escapes, not the JS animations which the hook already handles):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 2. Per-section animation spec (15 sections)

All reveals use `Reveal`/`RevealItem` (§1.4) unless noted. "Signature motion" is the one storytelling beat per section that earns its keep. Triggers: **WIV** = `whileInView` (one-shot reveal), **SCROLL** = `useScroll` progress-linked, **HOVER** = pointer/focus micro-interaction, **AMBIENT** = looping while visible.

| # | Section | Entrance / scroll animation | Key micro-interactions | Signature "storytelling" motion | Trigger |
|---|---|---|---|---|---|
| 1 | **Hero** | Headline lines stagger up (`loose`, `y=lg`), subhead + CTA follow; primary CTA settles last with a faint `outBack` lift. | CTA spring on hover (`scale 1.02`, bg → `--primary-hover`); secondary "ghost" CTA underline-grow; magnetic cursor pull ≤6px (pointer-fine only). | **Animated contribution-graph / ecosystem node field** drifting behind copy with a periodic pulse traveling node→node (§3a). | AMBIENT + WIV |
| 2 | **Why Forge** | 3–4 value cards reveal in a staggered grid (`base`, `y=md`). | Card hover: 1px border → `--primary`, content lifts `-2px` (spring); icon does a one-shot 6° settle. | A short connecting hairline draws left→right beneath the heading linking the values into one statement (line-draw). | WIV |
| 3 | **How the ecosystem works** | Role pillars (Student · Mentor · Teacher · LCC) fade-rise in sequence. | Hover a role → its connector lines + label highlight to indigo; others dim to `--muted-foreground`. | **Node-link flow**: connection lines *draw* between roles + central Portal as the section enters (§3b). | SCROLL |
| 4 | **AI Domain Workflow** | Domain selector chips (AI / ML / SDSE) reveal; the active workflow panel cross-fades in. | Chip select → spring underline indicator slides (shared `layoutId`); panel content cross-fades (`inOut`). | Workflow steps illuminate sequentially (Groq AI suggests → student builds → mentor reviews), each step's node lighting as a packet reaches it. | HOVER + WIV |
| 5 | **Project Lifecycle** | Section header reveal, then the pipeline mounts. | Stage chip hover → tooltip rise + node ring pulse. | **Pipeline fills stage-by-stage on scroll** (Idea → Build → Review → Merge → Measured), each segment's fill + checkmark keyed to scroll progress (§3c). | SCROLL |
| 6 | **Mentor experience** | Split layout: copy reveals left, UI mock card reveals right with subtle `y=md`. | Mock "approve review" button → spring press + status badge flips `pending → approved` (color cross-fade). | A review request animates from mentee avatar → mentor card (packet along a curved path), landing as an approval. | WIV |
| 7 | **Teacher experience** | Copy + an animated mini analytics panel reveal together. | Domain filter chips toggle → bars re-tween to new heights (`spring`). | Tracking dashboard: cohort bars **grow from baseline** in a left-to-right stagger; a trend line draws over them (§3g). | WIV |
| 8 | **Mentee experience** | Copy reveals; a contribution streak strip reveals beneath. | Streak cells fill on hover with a ripple from the hovered cell outward (transform-scale only). | The student's contribution-graph cells **fill in date order** (like real commits arriving), ending on "this is your real GitHub work". | WIV |
| 9 | **Connected Ecosystem** | Central "Portal" node reveals (scale `outBack`), satellites fade-rise around it. | Hover a satellite → its link thickens + a packet runs to the center. | Orbiting/pulsing links between Portal ↔ roles ↔ integrations — a steady ambient "the system is alive" pulse (paused off-screen / reduced). | AMBIENT + WIV |
| 10 | **Integration Showcase** | Tab strip reveals; first integration panel fades in. | Tab change → indicator slide (`layoutId`), logo swap, content cross-fade (§3f). | **Connection-line map with traveling packets** (§3d): each integration shows data flowing GitHub/Discord/Calendar/Email/Groq → Portal. | HOVER + AMBIENT |
| 11 | **Learning + Building** | Two columns ("Learning measured" / "Building real") reveal; a center seam draws to join them. | Metric chips count-up on enter (§3e). | A merge motion: the two columns' top edges connect via a drawn bracket, implying "learning == real contribution". | WIV + SCROLL |
| 12 | **Analytics** | Header reveal, then chart panel. | Legend hover → series highlight, others dim; tooltip rise. | **Bar + line charts animate in** — bars grow from baseline (staggered), line draws via `pathLength` 0→1, area fills with delayed opacity (§3g). | WIV |
| 13 | **Security** | Lock/shield mark reveals (scale + fade), trust points stagger in. | Each trust row: check icon draws (`pathLength`) on enter. | A subtle "shield assembles" — segments converge to form the shield outline (transform only), reinforcing Google-OAuth / server-side RBAC trust story. | WIV |
| 14 | **Architecture** | Layered diagram (Client → ALB → ECS → RDS/Redis) reveals layer by layer top→down. | Hover a layer → its label + border highlight; request-path arrows pulse. | A request **packet travels the full path** (Internet → Cloudflare → ALB → ECS → DB) once on enter, then loops slowly while visible. | SCROLL + AMBIENT |
| 15 | **CTA** | Headline + button reveal centered; node field from hero subtly echoes behind (lower density). | Primary CTA: spring hover + a one-time shimmer sweep on first reveal (transform-driven, single pass). | A final convergence pulse — faint lines draw inward to the CTA button, "everything points here". | WIV |

> Note: the brief lists "Mentor/Teacher/Mentee experiences" as one slot; expanded above into sections 6–8 so each role gets a distinct beat, which keeps the canonical 15-section count (Hero, Why, How, AI Workflow, Lifecycle, Mentor, Teacher, Mentee, Connected Ecosystem, Integrations, Learning+Building, Analytics, Security, Architecture, CTA).

---

## 3. Signature visualizations — how to animate them

### 3a. Hero node field (drifting nodes + connecting lines + pulse)

**Canvas 2D** (not SVG) because of node count (~40–60) and a per-frame loop. Mounted as a client island, lazily started only when on-screen.

- **Structure:** a `<canvas>` sized to its container via `ResizeObserver`, drawn with `devicePixelRatio` scaling for crispness. Nodes are `{x, y, vx, vy}` drifting slowly; draw a line between any two nodes within a distance threshold (opacity ∝ proximity). Periodically, a **pulse** travels along an existing edge chain (a brightened indigo dot easing node→node), visually echoing a GitHub contribution propagating through the ecosystem.
- **Palette:** nodes `--border`/`--subtle-foreground` at low alpha; lines `--border` at ~0.4; pulse uses `--primary` `#4f46e5`. Keep it whisper-quiet behind text (overall ≤12% visual weight) — it must never reduce headline contrast (keep a solid surface or low-alpha scrim under the copy).
- **Loop:** single `requestAnimationFrame` loop; cap to ~30fps for the ambient drift (`if (t - last < 33) return;`) to save battery — the eye won't notice on slow drift. Pulse runs at 60fps for the brief moment it's active.
- **Lifecycle:** start the rAF loop on enter, **cancel it on exit** (IntersectionObserver / `useInView`) and on `visibilitychange` (tab hidden). Always `cancelAnimationFrame` in cleanup.
- **Reduced motion:** draw **one static composed frame** (nodes + lines, no pulse, no rAF) and return. Same for `prefers-reduced-data` if you choose to honor it.
- **Future (v3):** swap the Canvas 2D field for a three.js / WebGL point cloud behind a feature flag — same data model, GPU-instanced points; gated because of bundle weight (+~150KB) and the SSR/`window` care it requires.

```tsx
// sketch — client/components/landing/hero/node-field.tsx ("use client")
useEffect(() => {
  if (reduce) { drawStaticFrame(ctx); return; }            // reduced motion: one frame
  let raf = 0, last = 0;
  const loop = (t: number) => {
    if (t - last >= 33) { step(); draw(ctx); last = t; }    // ~30fps drift
    raf = requestAnimationFrame(loop);
  };
  if (inView && !document.hidden) raf = requestAnimationFrame(loop);
  const onVis = () => { /* pause/resume based on document.hidden */ };
  document.addEventListener("visibilitychange", onVis);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); };
}, [inView, reduce]);
```

### 3b. Ecosystem node-link flow — lines draw on scroll (SVG)

**SVG** (crisp, accessible, few elements). Each connection is a `<motion.path>` (or `<line>`) with `pathLength` animated 0→1 (motion normalizes `pathLength` so you don't hand-compute `stroke-dasharray`).

```tsx
<motion.path
  d={d} stroke="var(--primary)" strokeWidth={1.5} fill="none"
  initial={{ pathLength: 0, opacity: 0 }}
  whileInView={{ pathLength: 1, opacity: 1 }}
  viewport={{ once: true, amount: 0.5 }}
  transition={{ duration: dur.xslow, ease: ease.linearish }}
/>
```

For **scroll-progress** drawing (lines fill as you scroll through the section), drive `pathLength` from `useScroll`:

```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
const len = useTransform(scrollYProgress, [0, 1], [0, 1]);
// <motion.path style={{ pathLength: len }} />
```

Nodes pop with a tiny `outBack` scale as their incoming line arrives (sequence via `delay`). Reduced motion: paths render fully drawn (`pathLength: 1`, no `useScroll`).

### 3c. Project-lifecycle pipeline — fills stage-by-stage on scroll

Horizontal (desktop) / vertical (mobile) pipeline of 5 stages. A track rail with a **fill** overlay whose `scaleX` (or `scaleY` on mobile) is bound to `scrollYProgress`; stage nodes flip to "done" (`--success` ring + drawn check) as the fill passes them.

```tsx
const { scrollYProgress } = useScroll({ target: rail, offset: ["start 70%", "end 70%"] });
const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);        // 0..1
// rail fill: <motion.div style={{ scaleX: fill, originX: 0 }} className="bg-[var(--primary)] h-px" />
// per stage i of N: light up when scrollYProgress crosses i/(N-1)
const litN = useTransform(scrollYProgress, (p) => Math.round(p * (N - 1)));
```

Use **`scaleX` on a 1px rail**, never animate `width` (avoids layout). Stage checkmarks use `pathLength`. Reduced motion: rail fully filled, all stages "done" at rest.

### 3d. Integration map — packets traveling along paths (SVG)

Each integration (GitHub / Discord / Calendar / Email / Groq) is a node connected to the central **Portal** by an SVG path. A small **packet** (`<circle>` / `<rect>`) animates along the path to convey "data flows into the Portal".

- Position packets using SVG `offset-path` via motion, or interpolate along the path with `path.getPointAtLength()` (computed in `useEffect`, SSR-safe) driving `x/y` motion values. Simplest robust approach: CSS `offset-path: path("…"); offset-distance: 0→100%` animated by motion's `animate`.
- **Ambient loop** while the active tab/section is visible: packets repeat with staggered delays (`repeat: Infinity`, `repeatDelay`), so flow reads as continuous but sparse (1–2 packets per path, never a swarm).
- Pulse color `--primary`; idle path `--border`. On tab hover, the hovered integration's path thickens and its packet speeds up slightly.
- **Reduced motion / off-screen:** no packets; paths drawn static. Loops **pause on exit** (IntersectionObserver) and on tab-hidden.

### 3e. Number / stat count-ups

A `CountUp` client island using motion's `useMotionValue` + `animate` + `useTransform`, fired by `useInView` (once).

```tsx
// client/components/landing/motion/count-up.tsx ("use client")
export function CountUp({ to, duration = dur.slow, format = (n: number) => Math.round(n).toLocaleString() }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (n) => format(n));
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(to); return; }                 // reduced: jump to final
    const controls = animate(mv, to, { duration, ease: ease.out });
    return () => controls.stop();
  }, [inView, reduce, to]);
  // SSR-safe: render the final value as static text content for no-JS/crawlers,
  // then let motion drive it. <span ref={ref}><motion.span>{text}</motion.span></span>
}
```

The static fallback text (rendered server-side) **shows the final number**, so crawlers and no-JS users see the real value; motion only animates the climb. Use `tabular-nums` to prevent width jitter during the count.

### 3f. Tab cross-fades — integration showcase

Use `AnimatePresence` with `mode="wait"` for the panel body and a shared-layout indicator for the active tab.

```tsx
// active-tab underline: <motion.span layoutId="integration-tab" /> on the selected tab
<AnimatePresence mode="wait">
  <motion.div key={active}
    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
    transition={{ duration: dur.base, ease: ease.inOut }}>
    {panels[active]}
  </motion.div>
</AnimatePresence>
```

Keep tab **controls** as real buttons (`role="tab"`, `aria-selected`, arrow-key nav) — see §5. Reduced motion: drop the `y`, keep an instant opacity swap (or no transition). Avoid animating height; reserve panel min-height to prevent layout jump between tabs.

### 3g. Analytics — animated bar / line charts

Lightweight bespoke SVG (no charting lib needed for the landing; the app uses real charts elsewhere). Keep it on the compositor:

- **Bars:** each bar is a `<motion.rect>` (or a div) animated via **`scaleY` with `transform-origin: bottom`**, *not* `height`. Stagger left→right (`stagger.tight`). `whileInView`, once.
- **Line series:** a `<motion.path>` with `pathLength` 0→1 (`ease.out`, `dur.xslow`); the area fill fades in (`opacity`) after the line completes (`delay`).
- **Axes/gridlines:** static (no animation) to keep the eye on the data.
- **Legend hover:** highlight one series, dim others via opacity (`ease.inOut`, `dur.fast`).
- **Reduced motion:** bars at full height, line fully drawn, area visible — all at rest, no tween.

```tsx
<motion.rect
  x={x} width={w} y={baseY} height={h} style={{ originY: 1 }}   // origin bottom
  initial={{ scaleY: 0, opacity: 0 }}
  whileInView={{ scaleY: 1, opacity: 1 }}
  viewport={{ once: true, amount: 0.5 }}
  transition={{ duration: dur.base, ease: ease.out, delay: i * stagger.tight }}
  fill="var(--primary)"
/>
```

---

## 4. Performance budget

**Animate only `transform` + `opacity`.** That's the whole game for 60fps — both are GPU-compositable and skip layout + paint. Map every "size/position" change to a transform:

| Want | Don't animate | Do animate |
|---|---|---|
| Bar grows | `height` | `scaleY` + `transform-origin: bottom` |
| Rail fills | `width` | `scaleX` + `originX: 0` |
| Card lifts | `top` / `margin` | `y` (translate) |
| Reveal | `display` / layout | `opacity` + `y` |
| Line draws | `stroke-dasharray` math | motion `pathLength` |

- **`will-change`** sparingly: add `will-change: transform` (or `opacity`) only to elements *about to* animate, and remove it after — motion manages this for animating elements, so set it manually only on the long-lived ambient canvas/SVG containers, not on every revealed card (over-promoting layers wastes GPU memory).
- **Lazy-mount heavy canvas via IntersectionObserver.** The hero node field, integration map, and architecture packet loop only **run** while intersecting (`useInView` / IO). Off-screen → `cancelAnimationFrame`, stop motion loops. Also pause on `document.hidden` (`visibilitychange`).
- **Avoid layout thrash.** Batch DOM reads (e.g. `getBoundingClientRect`, `getPointAtLength`) in `useEffect`/`ResizeObserver`, never interleaved with writes in a rAF loop. Cache path lengths and node coords; recompute only on resize (debounced).
- **Cap ambient framerate.** Drift loops at ~30fps; only the brief pulse/packet bursts at 60fps. Reduce node count on small viewports (`< 768px` → ~50% nodes) and skip the field entirely on very small / low-DPR devices if the perf budget demands.
- **Bundle / code-split.** `motion` core (`motion/react`) is tree-shakeable — import only what's used (`motion`, `useScroll`, `useTransform`, `useInView`, `useReducedMotion`, `AnimatePresence`). Keep each visualization a separate `"use client"` island so Server Components stay zero-JS; `next/dynamic` with `{ ssr: false }` for the canvas-heavy islands (node field, integration map) so their code splits and never runs server-side. The page shell, copy, and all static sections ship **no animation JS**.
- **SSR-safety.** No `window` / `document` / `matchMedia` / `IntersectionObserver` / `requestAnimationFrame` at module scope or in render. Canvas islands are `dynamic(..., { ssr: false })` or guard every browser API inside `useEffect`. `useReducedMotion()` returns `false` on the server (safe default → full markup, then corrected on hydration).
- **Image/asset:** provider logos via the existing brand-icon component from `/public`; no animated GIFs/Lotties — all motion is code-driven.

---

## 5. Accessibility

- **`prefers-reduced-motion` fallback per animation** — see the §1.5 table. Every island calls `useReducedMotion()` and substitutes an instant/opacity-only path. Reduced motion **never hides content**: every reduced state equals the full animation's *end* state. Ambient loops (hero field, integration packets, architecture path) **do not run at all** under reduced motion — a static composed frame is drawn.
- **No motion-triggered content hiding.** Content is in the DOM and visible by default (`opacity: 1` in base CSS); JS lowers opacity post-mount only. If hydration fails or JS is off, everything is readable. `whileInView` reveals must never gate text behind a trigger that could fail to fire (use generous `viewport.amount` and `margin`, and `once: true` so a missed scroll can't permanently hide content). Consider `viewport={{ once: true }}` + a fallback `animate` so content reveals even if it loads already in-view.
- **Focus management.** Tabs (integration showcase, AI domain selector) are real `role="tablist"`/`role="tab"` controls with `aria-selected`, `aria-controls`, roving `tabindex`, and ArrowLeft/Right + Home/End handling. Focus styles use the existing `--ring` (`#a5b4fc`) and are **never** removed by animation. `AnimatePresence` panel swaps must not steal or trap focus; manage focus to the newly shown panel only on explicit user activation, not on scroll.
- **Pause ambient loops off-screen and when tab hidden.** IntersectionObserver stops the rAF/motion loops on exit; `visibilitychange` pauses on background tabs — saves battery and avoids distracting motion the user can't see.
- **Decorative vs meaningful.** The hero node field, ambient pulses, and packets are decorative → `aria-hidden="true"` on their containers, no role, not in the tab order. The pipeline, charts, and node-link diagram carry meaning → provide a text equivalent (visually-hidden caption or `aria-label`, e.g. "Project lifecycle: Idea, Build, Review, Merge, Measured" / data-table fallback for charts). Animation is purely presentational over an accessible static structure.
- **Contrast preserved during motion.** Reveals start at `opacity: 0` only briefly; never leave text at low opacity at rest. Keep a solid/low-alpha scrim behind hero copy so the drifting field can't drop text contrast below WCAG AA. Count-ups use `tabular-nums` so numbers don't reflow.
- **No vestibular triggers.** No large parallax, no full-screen zoom/spin, no rapid flashing (nothing > 3 flashes/sec). Travel distances stay small (≤24px); the few overshoots (`outBack`) are ≤8px.

---

### File / island map (suggested)

```
client/lib/motion/tokens.ts                         # ease, dur, dist, stagger
client/components/landing/motion/reveal.tsx          # Reveal + RevealItem ("use client")
client/components/landing/motion/count-up.tsx        # CountUp ("use client")
client/components/landing/hero/node-field.tsx        # Canvas 2D ambient field (dynamic, ssr:false)
client/components/landing/ecosystem/node-link.tsx    # SVG draw-on-scroll
client/components/landing/lifecycle/pipeline.tsx     # scroll-linked fill
client/components/landing/integrations/map.tsx       # SVG packets (dynamic, ssr:false)
client/components/landing/integrations/tabs.tsx      # AnimatePresence cross-fade + layoutId
client/components/landing/analytics/charts.tsx       # bar/line SVG reveal
```

Each is a small `"use client"` island; the landing page route (`app/(marketing)/page.tsx` or similar) stays a Server Component that composes static copy + these islands.
