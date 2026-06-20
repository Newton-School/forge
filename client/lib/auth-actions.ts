"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPresentation, ROLE_COOKIE_NAME } from "@/lib/session";
import { DOMAIN_COOKIE_NAME } from "@/lib/presentation";
import { serverOrigin } from "@/lib/server-origin";

/** Backend origin for the server-side logout call (API_PROXY_TARGET, else from NEXT_PUBLIC_API_URL). */
const SERVER_ORIGIN = serverOrigin();
const SESSION_COOKIE = "forge.sid";
const CSRF_COOKIE = "forge_csrf";
/** Cookie scope — must MATCH how the server set them, or the delete won't clear them. When the
 *  client + API are on split subdomains, the session/CSRF cookies are scoped to the shared
 *  parent (e.g. ".taj.works"); a host-only delete would leave them in place. Unset on localhost. */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

/**
 * Sign out and return to the public landing page.
 *
 * Production: revoke the real server session (`POST /api/auth/logout`, echoing the
 * double-submit CSRF token), then clear the first-party session/CSRF cookies. Revocation is
 * best-effort — we clear locally and redirect regardless so the user always lands signed-out.
 *
 * Presentation: there is no real session — just drop the demo role/domain cookies so the next
 * visit starts from the landing page.
 */
export async function signOut(): Promise<void> {
  const store = await cookies();

  if (!isPresentation) {
    const csrf = store.get(CSRF_COOKIE)?.value;
    const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    try {
      await fetch(`${SERVER_ORIGIN}/api/auth/logout`, {
        method: "POST",
        headers: { cookie: cookieHeader, ...(csrf ? { "x-csrf-token": csrf } : {}) },
        cache: "no-store",
      });
    } catch {
      // best-effort — clear locally and redirect regardless
    }
    // Delete with the SAME domain/path the cookies were set with, else a host-only delete
    // leaves a parent-domain (".taj.works") cookie in place and the user stays signed in.
    store.delete({ name: SESSION_COOKIE, domain: COOKIE_DOMAIN, path: "/" });
    store.delete({ name: CSRF_COOKIE, domain: COOKIE_DOMAIN, path: "/" });
  } else {
    store.delete(ROLE_COOKIE_NAME);
    store.delete(DOMAIN_COOKIE_NAME);
  }

  redirect("/landing");
}
