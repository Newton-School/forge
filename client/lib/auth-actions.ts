"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPresentation, ROLE_COOKIE_NAME } from "@/lib/session";
import { DOMAIN_COOKIE_NAME } from "@/lib/presentation";

/** Backend origin for the server-side logout call (same value as the API proxy target). */
const SERVER_ORIGIN = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
const SESSION_COOKIE = "forge.sid";
const CSRF_COOKIE = "forge_csrf";

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
    store.delete(SESSION_COOKIE);
    store.delete(CSRF_COOKIE);
  } else {
    store.delete(ROLE_COOKIE_NAME);
    store.delete(DOMAIN_COOKIE_NAME);
  }

  redirect("/landing");
}
