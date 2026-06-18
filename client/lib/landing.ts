/**
 * Content + structured data for the public marketing landing page (Forge, by the
 * Learner Career Council at Newton School of Technology). Kept here so the section
 * components stay presentational and the copy lives in one editable place.
 */

export const BRAND = {
  name: "Forge",
  org: "Learner Career Council",
  orgShort: "LCC",
  school: "Newton School of Technology",
  schoolShort: "NST",
  tagline: "Build. Learn. Contribute.",
} as const;

export const HERO_STATS = [
  { value: "4", label: "Domains", hint: "AI · ML · SDSE · DVA" },
  { value: "L1–L4", label: "Review depth", hint: "Mentee → Teacher" },
  { value: "5", label: "Connected systems", hint: "GitHub · Discord · Calendar · Email · AI" },
  { value: "100%", label: "Measurable", hint: "Every contribution tracked" },
] as const;

export const PROBLEMS = [
  {
    problem: "Passive learning",
    detail: "Students watch and forget. Knowledge never turns into anything real.",
    solution: "Learning happens through building: issues, branches, and pull requests, not slides.",
  },
  {
    problem: "No visibility",
    detail: "Teachers can't see who's actually contributing until it's too late.",
    solution: "Every commit, PR, and review streams in live and rolls up into team health.",
  },
  {
    problem: "No contribution tracking",
    detail: "Effort is invisible; grades guess at who did the work.",
    solution: "Contribution is attributed to each student automatically, by stable GitHub identity.",
  },
  {
    problem: "No project ownership",
    detail: "Group work hides freeloaders and buries the builders.",
    solution: "Self-assigned issues and authored PRs make ownership explicit and individual.",
  },
  {
    problem: "Weak mentoring loops",
    detail: "Feedback is sporadic, unstructured, and lost in chat.",
    solution: "A four-level review cadence (L1–L4) keeps mentors and teachers in the loop on time.",
  },
] as const;

export const ECOSYSTEM_FLOW = [
  { label: "Teacher", note: "Sets direction, decides L4" },
  { label: "Mentors", note: "Guide & review teams" },
  { label: "Teams", note: "Pods that ship together" },
  { label: "Repositories", note: "Where work lives" },
  { label: "Issues", note: "Scoped, self-assigned" },
  { label: "Pull Requests", note: "Authored contribution" },
  { label: "Reviews", note: "Mentor feedback loop" },
  { label: "Learning", note: "Measured, visible growth" },
] as const;

export const LIFECYCLE = [
  { stage: "Issue", note: "A scoped task is opened on the repo." },
  { stage: "Self-assign", note: "A student claims ownership of it." },
  { stage: "Branch", note: "Work starts on a feature branch." },
  { stage: "Development", note: "Code, commits, and progress updates." },
  { stage: "Pull Request", note: "The contribution is opened for review." },
  { stage: "Review", note: "Mentors review, comment, request changes." },
  { stage: "Merge", note: "Approved work lands on the main branch." },
  { stage: "Milestone", note: "Merged work advances the project milestone." },
] as const;

export const ROLES = [
  {
    role: "Mentee",
    headline: "See exactly what to build next.",
    points: [
      "Assigned repositories & issues in one place",
      "Your contributions, PRs, and review status",
      "Daily L1 updates: worked on · learning · blocker · next",
      "Personal progress and mentor feedback",
    ],
  },
  {
    role: "Mentor",
    headline: "Lead the team, review the work.",
    points: [
      "Live team & contribution tracking",
      "Pull-request reviews in context",
      "L2 weekly status · L3 evaluations",
      "Auto-flags for consistency gaps & blockers",
    ],
  },
  {
    role: "Teacher",
    headline: "Track every team at a glance.",
    points: [
      "Team comparisons & repository analytics",
      "Student activity across domains",
      "Milestone progress and risk signals",
      "L4 decisions: continue · monitor · discuss",
    ],
  },
] as const;

export type IntegrationKey = "github" | "discord" | "calendar" | "email" | "groq";

export const INTEGRATIONS: {
  key: IntegrationKey;
  name: string;
  role: string;
  blurb: string;
  points: string[];
}[] = [
  {
    key: "github",
    name: "GitHub",
    role: "The contribution spine",
    blurb:
      "Real repositories, issues, and pull requests are the substrate of the drive. Activity streams in through HMAC-verified webhooks and is attributed to each student automatically.",
    points: [
      "AI domain runs on a GitHub org with Teams",
      "ML / SDSE / DVA link per-repo with one click",
      "Commits · PRs · reviews · milestones synced live",
      "No GitHub App, no stored user tokens",
    ],
  },
  {
    key: "discord",
    name: "Discord",
    role: "The communication layer",
    blurb:
      "Teams collaborate, mentors guide, and announcements stay centralized. Discord is where the day-to-day conversation of every domain and team happens.",
    points: [
      "Per-team & per-domain channels",
      "Mentor discussions & office hours",
      "Centralized announcements",
      "Identity linked to each member",
    ],
  },
  {
    key: "calendar",
    name: "Google Calendar",
    role: "The schedule",
    blurb:
      "Mentoring sessions, reviews, checkpoints, and milestone deadlines sync to one shared Forge Drive calendar, so nobody misses what matters.",
    points: [
      "Mentoring sessions & review meetings",
      "Milestone deadlines & checkpoints",
      "One shared drive-wide calendar",
      "Synced server-side via service account",
    ],
  },
  {
    key: "email",
    name: "Email",
    role: "The notification engine",
    blurb:
      "From onboarding invitations to deadline reminders and concern escalations, transactional email keeps the whole drive organized and on time.",
    points: [
      "Invite-only onboarding emails",
      "Deadline & review reminders",
      "Milestone alerts",
      "Concern escalation notices",
    ],
  },
  {
    key: "groq",
    name: "Forge AI",
    role: "The intelligence layer",
    blurb:
      "Forge AI summarizes reviews, surfaces contribution insights, and analyzes progress, assisting mentors and teachers with signal without ever replacing their judgment.",
    points: [
      "Review & PR summaries",
      "Contribution insights",
      "Progress & risk analysis",
      "Assists mentors, never replaces them",
    ],
  },
];

export const SECURITY = [
  { title: "Google OAuth only", detail: "No passwords. Sign in with your NST Google account, nothing else." },
  { title: "Invite-only access", detail: "Accounts are provisioned by Admin/LCC; unknown emails are rejected." },
  { title: "Server-side RBAC", detail: "Every request is gated, policy-checked, and scope-filtered in the backend." },
  { title: "Domain & team isolation", detail: "You only ever see the domains and teams you belong to." },
  { title: "Audit trails", detail: "Every privileged action is recorded immutably: who, what, and when." },
  { title: "Verified webhooks", detail: "Every inbound GitHub/Discord event is signature-verified before it's trusted." },
] as const;

export const ARCHITECTURE = [
  { layer: "Client", tech: "Next.js", note: "UI only: dashboards, forms, analytics. No secrets, no direct integrations." },
  { layer: "Server", tech: "Express + TypeScript", note: "All business logic, RBAC, integrations, and webhooks live here." },
  { layer: "Data", tech: "PostgreSQL + Redis", note: "Prisma-modeled domain data; Redis-backed sessions and cache." },
  { layer: "Integrations", tech: "GitHub · Discord · Calendar · Email · Forge AI", note: "Server-only service modules, swappable behind interfaces." },
] as const;

export const NAV_LINKS = [
  { href: "#why", label: "Why Forge" },
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "#lifecycle", label: "Lifecycle" },
  { href: "#integrations", label: "Integrations" },
  { href: "#architecture", label: "Architecture" },
] as const;
