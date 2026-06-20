/**
 * Backend origin for SERVER-SIDE (SSR / server action) calls to the API.
 *
 * Browser calls use NEXT_PUBLIC_API_URL directly. Server-side, Next can't use a relative URL,
 * so it needs an absolute origin. Resolution order:
 *   1. API_PROXY_TARGET — explicit override (e.g. the in-cluster service name `http://server:4000`
 *      under docker-compose, where `localhost` would be the client container itself).
 *   2. Derived from NEXT_PUBLIC_API_URL's origin — so a split-host deploy (Vercel client +
 *      Render API) Just Works off the one public URL, without a second env var to forget.
 *   3. localhost:4000 — local fallback.
 */
export function serverOrigin(): string {
  if (process.env.API_PROXY_TARGET) return process.env.API_PROXY_TARGET;
  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (pub && /^https?:\/\//i.test(pub)) {
    try {
      return new URL(pub).origin;
    } catch {
      /* not an absolute URL — fall through */
    }
  }
  return "http://localhost:4000";
}
