"use client";
import { useState } from "react";
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
  repo: string; // "owner/name" or ""
  hasTeam: boolean;
}

/** Verified-identity connection flow. Usernames are NOT typed — they come back
 *  from the provider's OAuth sign-in, so a user can't claim someone else's handle.
 *  Phase 1: the "Connect" button simulates the OAuth round-trip and reveals the
 *  verified identity passed from the server. Phase 3 swaps in real OAuth. */
export function ConnectionsPanel({
  fullName, githubUsername, discordUsername, googleEmail, repo, hasTeam,
}: Props) {
  const [gh, setGh] = useState(false);
  const [dc, setDc] = useState(false);
  const [gc, setGc] = useState(true); // calendar shown connected by default

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
              Sign in with GitHub to <strong>verify your username</strong> and grant <strong>read-only access</strong> to your
              project repository. Commits, PRs, issues and reviews then sync to your progress.
            </p>

            <div className="mt-3">
              {gh ? (
                <div className="flex flex-col gap-3">
                  <div className="w-72"><VerifiedChip handle={`@${githubUsername}`} /></div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
                      {hasTeam ? "Repository · read access granted" : "Organization · read access granted"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-foreground">
                      {repo ? `github.com/${repo}` : "your accessible repositories"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Contents (read)", "Metadata (read)", "Issues (read)", "Pull requests (read)"].map((s) => (
                        <Badge key={s} tone="neutral">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Manage repository access</Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setGh(false)}>
                      <Unplug className="size-3.5" /> Disconnect
                    </Button>
                  </div>
                  <p className="text-xs text-subtle-foreground">Read-only — the platform never writes to your repository. Revoke anytime from GitHub.</p>
                </div>
              ) : (
                <Button size="sm" onClick={() => setGh(true)}>
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
