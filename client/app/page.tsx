import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav/nav.config";

export default async function RootPage() {
  // Phase 1: route to the previewed role's dashboard. Phase 3: redirect to
  // /login when unauthenticated, else to the authenticated role home.
  const role = await getCurrentRole();
  redirect(ROLE_HOME[role]);
}
