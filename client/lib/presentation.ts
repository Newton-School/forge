/**
 * PHASE 1 ONLY — domain dimension of presentation mode (client-safe).
 *
 * Pure data + types only (no `next/headers`), so both client components (the Domain
 * Switcher) and server components can import it. The server-only cookie read lives in
 * `lib/session.ts` (`getActiveDomain`). The AI Domain is GitHub-driven and fully built;
 * ML/SDSE/DVA reuse the existing "drive" screens as their workflow.
 */
export type DomainKey = "AI" | "ML" | "SDSE" | "DVA";

export interface DomainMeta {
  key: DomainKey;
  name: string;
  /** Whether this domain runs the GitHub-driven workflow (AI only, in Phase 1). */
  githubDriven: boolean;
  blurb: string;
}

export const DOMAIN_META: Record<DomainKey, DomainMeta> = {
  AI: { key: "AI", name: "Artificial Intelligence", githubDriven: true, blurb: "GitHub-driven: org → teams → repos → issues → PRs → reviews." },
  ML: { key: "ML", name: "Machine Learning", githubDriven: false, blurb: "Drive workflow: updates, tasks, deliverables and reviews." },
  SDSE: { key: "SDSE", name: "Software Dev & Systems Eng", githubDriven: false, blurb: "Drive workflow: updates, tasks, deliverables and reviews." },
  DVA: { key: "DVA", name: "Data Visualisation & Analytics", githubDriven: false, blurb: "Drive workflow: updates, tasks, deliverables and reviews." },
};

export const DOMAIN_COOKIE_NAME = "forge_domain";
export const DOMAIN_KEYS: DomainKey[] = ["AI", "ML", "SDSE", "DVA"];
