"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ShieldCheck, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandIcon } from "@/components/integrations/brand-icon";
import { initials } from "@/lib/utils";

interface Props {
  fullName: string;
  githubUsername: string;
  discordUsername: string;
  googleEmail: string;
  repo: string; // currently-bound "owner/name" (or "")
  /** AI = repo access via the org; ML/SDSE/DVA = per-repo connect. */
  domainKey: "AI" | "ML" | "SDSE" | "DVA";
  role: string;
  teamId?: string;
  /** Demo mode simulates the round-trip; production redirects to the server OAuth route. */
  presentation: boolean;
  apiBase: string;
  initiallyConnected?: boolean;
}

/** Map the `?github=` status the server redirects back with → a banner message. */
const GH_RESULT: Record<string, { ok: boolean; msg: string }> = {
  connected: { ok: true, msg: "GitHub connected — your username is verified." },
  repo_ok: { ok: true, msg: "GitHub connected and the team repository webhook was created." },
  repo_exists: { ok: true, msg: "GitHub connected — the repository webhook was already in place." },
  repo_error: { ok: false, msg: "Connected your username, but the repo webhook couldn't be created (need admin on the repo)." },
  denied: { ok: false, msg: "GitHub connection was cancelled or failed verification." },
  unconfigured: { ok: false, msg: "GitHub Connect isn't configured on the server yet." },
};

/** Verified-identity connection flow. Usernames are NOT typed — they come back from
 *  the provider's OAuth sign-in, so a user can't claim someone else's handle. In
 *  presentation mode "Connect" simulates the round-trip; in production it redirects to
 *  the server's OAuth route, which links the username and (for an ML/SDSE mentor) wires
 *  the team repo's webhook in one click. */
export function ConnectionsPanel({
  fullName, githubUsername, discordUsername, googleEmail, repo,
  domainKey, role, teamId, presentation, apiBase, initiallyConnected = false,
}: Props) {
  const params = useSearchParams();
  const ghResult = GH_RESULT[params.get("github") ?? ""];

  const isOrgDomain = domainKey === "AI";
  const canManageRepo = ["MENTOR", "TEACHER", "ADMIN", "LCC"].includes(role);
  // ML/SDSE mentor/lead can bind a team repo; everyone else just links a username.
  const showRepoConnect = !isOrgDomain && canManageRepo && Boolean(teamId);

  const [gh, setGh] = useState(initiallyConnected);
  const [boundRepo, setBoundRepo] = useState(repo);
  const [repoInput, setRepoInput] = useState("");
  const [dc, setDc] = useState(false);
  const [gc, setGc] = useState(true); // calendar shown connected by default

  /** Start the connect flow. In production this leaves the SPA for GitHub's consent. */
  function connectGitHub(withRepo?: string) {
    if (presentation) {
      setGh(true);
      if (withRepo) setBoundRepo(withRepo);
      return;
    }
    const base = apiBase.replace(/\/$/, "");
    const qs = new URLSearchParams();
    if (withRepo && teamId) { qs.set("repo", withRepo); qs.set("teamId", teamId); }
    const query = qs.toString();
    window.location.href = `${base}/integrations/github/oauth/start${query ? `?${query}` : ""}`;
  }

  const VerifiedChip = ({ handle }: { handle: string }) => (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2">
      <Avatar className="size-7"><AvatarFallback>{initials(fullName)}</AvatarFallback></Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{handle}</p>
        <p className="text-[11px] text-muted-foreground">{fullName}</p>
      </div>
      <Badge tone="success" className="ml-auto"><ShieldCheck className="size-3" /> Verified</Badge>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {ghResult && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            ghResult.ok
              ? "border-success/30 bg-success-bg/50 text-success"
              : "border-warning/30 bg-warning-bg/50 text-warning"
          }`}
        >
          {ghResult.ok ? <Check className="mt-0.5 size-4 shrink-0" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0" />}
          <p className="text-foreground/80">{ghResult.msg}</p>
        </div>
      )}

      {/* Discord */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-white">
            <BrandIcon name="discord" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Discord</h2>
              {dc
                ? <Badge tone="success"><Check className="size-3" /> Connected &amp; verified</Badge>
                : <Badge tone="warning">Not connected</Badge>}
            </div>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              Verify your Discord by signing in — we read your handle from Discord, so you can&apos;t enter
              someone else&apos;s. <span className="text-subtle-foreground">Username only for now; server-activity sync comes later.</span>
            </p>

            <div className="mt-3">
              {dc ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-72"><VerifiedChip handle={`@${discordUsername}`} /></div>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setDc(false)}>
                    <Unplug className="size-3.5" /> Disconnect
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setDc(true)}>
                  Connect with Discord
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* GitHub */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-white">
            <BrandIcon name="github" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">GitHub</h2>
              {gh
                ? <Badge tone="success"><Check className="size-3" /> Connected &amp; verified</Badge>
                : <Badge tone="warning">Not connected</Badge>}
            </div>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              {isOrgDomain ? (
                <>Sign in with GitHub to <strong>verify your username</strong>. Your team&apos;s repo is read via the{" "}
                <span className="font-mono">newton-school-ai</span> organization — nothing to connect per-repo.</>
              ) : showRepoConnect ? (
                <>Sign in with GitHub to <strong>verify your username</strong>, then connect your team&apos;s repository —
                Forge <strong>creates the webhook automatically</strong> (no GitHub settings to touch).</>
              ) : (
                <>Sign in with GitHub to <strong>verify your username</strong> so your commits, PRs and reviews sync to your progress.</>
              )}
            </p>

            <div className="mt-3">
              {gh ? (
                <div className="flex flex-col gap-3">
                  <div className="w-72"><VerifiedChip handle={`@${githubUsername}`} /></div>

                  {isOrgDomain ? (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">Repository · via organization</p>
                      <p className="mt-1 font-mono text-xs text-foreground">
                        {boundRepo ? `github.com/${boundRepo.replace(/^https?:\/\/github\.com\//, "")}` : "newton-school-ai (org access)"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {["Contents (read)", "Metadata (read)", "Issues (read)", "Pull requests (read)"].map((s) => (
                          <Badge key={s} tone="neutral">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : showRepoConnect ? (
                    boundRepo ? (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">Team repository · webhook active</p>
                        <p className="mt-1 font-mono text-xs text-foreground">github.com/{boundRepo.replace(/^https?:\/\/github\.com\//, "")}</p>
                        <p className="mt-1 text-xs text-subtle-foreground">Pushes, PRs, reviews and issues now stream to Forge.</p>
                      </div>
                    ) : (
                      <RepoConnect
                        value={repoInput}
                        onChange={setRepoInput}
                        onSubmit={() => connectGitHub(repoInput)}
                        label="Connect your team repository"
                        cta="Create webhook"
                      />
                    )
                  ) : (
                    <p className="text-xs text-subtle-foreground">Your team&apos;s repository is managed by your mentor.</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setGh(false)}>
                      <Unplug className="size-3.5" /> Disconnect
                    </Button>
                  </div>
                  <p className="text-xs text-subtle-foreground">Read-only — Forge never writes code to your repository. Revoke anytime from GitHub.</p>
                </div>
              ) : showRepoConnect ? (
                <div className="flex flex-col gap-3">
                  <RepoConnect
                    value={repoInput}
                    onChange={setRepoInput}
                    onSubmit={() => connectGitHub(repoInput)}
                    label="Connect & create the team repo webhook"
                    cta="Connect with GitHub"
                  />
                  <button type="button" className="self-start text-xs text-muted-foreground underline" onClick={() => connectGitHub()}>
                    or just connect my username
                  </button>
                </div>
              ) : (
                <Button size="sm" onClick={() => connectGitHub()}>
                  Connect with GitHub
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Google Calendar */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-white">
            <BrandIcon name="calendar" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Google Calendar</h2>
              {gc
                ? <Badge tone="success"><Check className="size-3" /> Connected</Badge>
                : <Badge tone="warning">Not connected</Badge>}
            </div>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              Sync your meetings, reviews and deadlines — and automatically receive
              <strong> every drive-wide event organized by LCC</strong>.
            </p>
            <div className="mt-3">
              {gc ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-72"><VerifiedChip handle={googleEmail} /></div>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setGc(false)}>
                    <Unplug className="size-3.5" /> Disconnect
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setGc(true)}>
                  Connect with Google
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Repo URL field + submit — the mentor's one-click "connect + create webhook" entry. */
function RepoConnect({
  value, onChange, onSubmit, label, cta,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  label: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="owner/repo or https://github.com/owner/repo"
          spellCheck={false}
          className="w-80 max-w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-xs outline-none focus:border-foreground/30"
        />
        <Button size="sm" disabled={!value.trim()} onClick={onSubmit}>{cta}</Button>
      </div>
    </div>
  );
}
