import { InvitationsView } from "@/components/onboarding/invitations-view";
import { api } from "@/lib/api";

export default async function AdminInvitationsPage() {
  const [invitations, domains, teams, allUsers] = await Promise.all([
    api.invitations(), api.domains(), api.teams(), api.users(),
  ]);
  const mentors = allUsers.filter((u) => u.role === "MENTOR");
  return <InvitationsView invitations={invitations} domains={domains} teams={teams} mentors={mentors} />;
}
