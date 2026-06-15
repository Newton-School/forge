import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionsPanel } from "@/components/integrations/connections-panel";
import { getCurrentUser } from "@/lib/session";
import { TEAMS } from "@/lib/api";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();
  const team = TEAMS.find((t) => t.id === user.teamId);
  const local = user.email.split("@")[0];

  // Identities are derived here to stand in for what the OAuth providers return.
  const githubUsername = user.fullName.toLowerCase().replace(/\s+/g, "-");
  const discordUsername = user.fullName.toLowerCase().replace(/\s+/g, "_");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Connections"
        description="Link and verify your accounts. These apply to your account, on every role."
      />

      <div className="flex items-start gap-2 rounded-lg border border-border bg-info-bg/50 px-4 py-3 text-sm text-info">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p className="text-foreground/80">
          <strong>Identities are verified, not typed.</strong> GitHub and Discord are confirmed by signing in
          through the provider — the platform reads your real username from the OAuth response, so no one can
          enter a random or someone else&apos;s handle.
        </p>
      </div>

      <ConnectionsPanel
        fullName={user.fullName}
        githubUsername={githubUsername}
        discordUsername={discordUsername}
        googleEmail={`${local}@nst.edu`}
        repo={team?.repo ?? ""}
        hasTeam={Boolean(user.teamId)}
      />

      <p className="text-xs text-subtle-foreground">
        Phase 1 preview — connecting simulates the OAuth round-trip and reveals the verified identity.
        Live OAuth (GitHub App, Discord <span className="font-mono">identify</span>, Google) is wired in a later
        phase; see <span className="font-mono">docs/integration-setup.md</span>.
      </p>
    </div>
  );
}
