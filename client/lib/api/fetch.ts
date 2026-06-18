/**
 * The single fetch primitive for the data layer. It works in BOTH execution contexts:
 *
 *  - **Server components** — there is no browser to attach the session cookie, so we read
 *    the request cookies via `next/headers` and forward them, calling the backend at its
 *    absolute origin (`API_PROXY_TARGET`). `credentials:"include"` is a no-op on the server.
 *  - **Client components** — a relative `/api/*` request is same-origin (the Next rewrite
 *    proxies it to the backend), so the browser attaches the first-party cookie automatically.
 *
 * Keeping this split in one place means accessors don't care where they run.
 */
import { fetchRetry } from "@/lib/http";

/** Public API base for browser requests (proxied to the backend by the Next rewrite). */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
/** Absolute backend origin for server-side requests (same value as the API proxy target). */
const SERVER_ORIGIN = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

/** GET `path` (e.g. "/users") as JSON, forwarding the session cookie when run server-side. */
export async function fetchJson<T>(path: string): Promise<T> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const cookie = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await fetch(`${SERVER_ORIGIN}/api${path}`, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return (await res.json()) as T;
  }
  const res = await fetchRetry(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}
