import { InvitationsView } from "@/components/onboarding/invitations-view";
import { INVITATIONS } from "@/lib/api";

export default function LccInvitationsPage() {
  return <InvitationsView invitations={INVITATIONS} />;
}
