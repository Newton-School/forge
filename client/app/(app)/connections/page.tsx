import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionsPanel } from "@/components/integrations/connections-panel";
import { getCurrentUser, getActiveDomain, getConnections } from "@/lib/session";
import { isPresentationMode } from "@/lib/config";
import { TEAMS } from "@/lib/api";

const PRESENTATION = isPresentationMode();
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();
  const domainKey = await getActiveDomain();
  const team = TEAMS.find((t) => t.id === user.teamId);
  const local = user.email.split("@")[0];

  // Production: real, server-verified status (identities come from the OAuth providers, repo from
  // the DB). Presentation: derive representative values so the demo round-trip still reads well.
  const conn = await getConnections();
  const githubUsername = conn?.github.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-");
  const discordUsername = conn?.discord.username ?? user.fullName.toLowerCase().replace(/\s+/g, "_");
  const boundRepo = conn?.repo.url ?? conn?.repo.name ?? team?.repo ?? "";

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

      <Suspense fallback={null}>
        <ConnectionsPanel
          fullName={user.fullName}
          githubUsername={githubUsername}
          discordUsername={discordUsername}
          googleEmail={user.email}
          repo={boundRepo}
          domainKey={domainKey}
          role={user.role}
          teamId={conn?.repo.teamId ?? user.teamId}
          presentation={PRESENTATION}
          apiBase={API_BASE}
          githubConnected={conn?.github.connected ?? false}
          discordConnected={conn?.discord.connected ?? false}
          calendarInApp={Boolean(conn)}
          repoMode={conn?.repo.mode}
          repoCanConnect={conn?.repo.canConnect}
        />
      </Suspense>

      <p className="text-xs text-subtle-foreground">
        <strong>GitHub Connect is live</strong> — in production the button redirects to the GitHub OAuth App
        (owned by <span className="font-mono">lcc-ai-nst</span>), which verifies your username and, for an
        ML/SDSE mentor, creates the team repo webhook automatically. In demo mode it simulates the round-trip.
        Discord and Google sign-in are wired in a later phase; see <span className="font-mono">docs/github-setup.html</span>.
      </p>
    </div>
  );
}
