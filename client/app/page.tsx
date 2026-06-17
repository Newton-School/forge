import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentRole, ROLE_COOKIE_NAME } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav/nav.config";

export default async function RootPage() {
  // First-time / signed-out visitors (no role cookie yet) see the public landing
  // page. Returning demo users who've picked a role go straight to their
  // dashboard. Phase 3 replaces the cookie check with the real Auth.js session.
  const store = await cookies();
  if (!store.get(ROLE_COOKIE_NAME)?.value) {
    redirect("/landing");
  }
  const role = await getCurrentRole();
  redirect(ROLE_HOME[role]);
}
