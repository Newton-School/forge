import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentRole, getOptionalUser, isPresentation, ROLE_COOKIE_NAME } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav/nav.config";

export default async function RootPage() {
  // Production: route by the REAL session — signed-in users land on their role dashboard,
  // signed-out visitors only ever see the public landing page.
  if (!isPresentation) {
    const user = await getOptionalUser();
    redirect(user ? ROLE_HOME[user.role] : "/landing");
  }

  // Presentation: first-time / signed-out visitors (no role cookie) see the landing;
  // returning demo users who've picked a role go straight to their dashboard.
  const store = await cookies();
  if (!store.get(ROLE_COOKIE_NAME)?.value) redirect("/landing");
  redirect(ROLE_HOME[await getCurrentRole()]);
}
