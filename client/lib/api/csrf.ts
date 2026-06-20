/**
 * CSRF token resolution for browser mutations.
 *
 * The server uses a double-submit cookie (forge_csrf): a readable cookie that must be echoed in
 * the x-csrf-token header. Reading document.cookie directly is unreliable when the client + API
 * are on different subdomains (the OAuth flow delivers forge_csrf to the SSR function, not the
 * browser, and a host-only cookie on the API host isn't visible to the client host). So we ask
 * the server what token it will validate against via GET /auth/csrf — that request also primes
 * the forge_csrf cookie in the browser, so the matching cookie is sent on the mutating request.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function fromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith("forge_csrf="))?.split("=")[1];
}

let cache: string | undefined;

/** The CSRF token the server agrees with (cached; pass force=true to refresh after a 403). */
export async function getCsrf(force = false): Promise<string | undefined> {
  if (!force && cache) return cache;
  try {
    const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { csrfToken?: string | null };
      cache = data.csrfToken ?? fromCookie();
      return cache;
    }
  } catch {
    /* fall through to the cookie */
  }
  return fromCookie();
}

/** Header object to spread into a fetch's headers (empty when no token is available). */
export async function csrfHeaders(force = false): Promise<Record<string, string>> {
  const token = await getCsrf(force);
  return token ? { "x-csrf-token": token } : {};
}
