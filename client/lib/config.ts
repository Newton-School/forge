/**
 * Presentation (demo) mode.
 *
 * When ON, the app shows the seeded mock dataset (see lib/mock/data.ts) and the
 * demo affordances (the "Viewing as" role switcher + a Presentation badge).
 *
 * Toggle it with the dedicated `APP_MODE` env var:
 *     APP_MODE=presentation   → demo mode ON
 *     APP_MODE=production      → demo mode OFF (real backend, Phase 3)
 *
 * NOTE: `NODE_ENV` is reserved by Next.js (it forces "development" / "production"
 * and will override a custom value), so we use APP_MODE as the real switch.
 * A literal `NODE_ENV=presentation` is still honored as a fallback if it ever
 * reaches the runtime.
 */
export function appMode(): string {
  // NEXT_PUBLIC_APP_MODE (client bundle) → APP_MODE (server) → NODE_ENV → development. The single
  // source of truth: every presentation check derives from this so chrome + data never disagree.
  return process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? process.env.NODE_ENV ?? "development";
}

export function isPresentationMode(): boolean {
  return appMode() === "presentation";
}

export const PRESENTATION = isPresentationMode();
