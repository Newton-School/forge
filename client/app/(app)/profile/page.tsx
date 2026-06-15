import Link from "next/link";
import { Mail, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { BrandIcon } from "@/components/integrations/brand-icon";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const NAME = "Sneha Iyer";
const EMAIL = "sneha@nst.edu";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile & Settings" description="Manage your account details and security." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Account" description="Your identity in the drive" bodyClassName="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-12"><AvatarFallback className="text-sm">{initials(NAME)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{NAME}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="size-3" /> {EMAIL}</p>
              </div>
              <Badge tone="primary" className="ml-auto">Mentee</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" defaultValue={NAME} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={EMAIL} disabled />
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm">Save changes</Button>
            </div>

            {/* Linked accounts are verified via OAuth on Connections, not typed here. */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle-foreground">Linked accounts</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <BrandIcon name="discord" size={16} />
                  <span className="text-sm">@sneha_iyer</span>
                  <Badge tone="success" className="ml-auto"><ShieldCheck className="size-3" /> Verified</Badge>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <BrandIcon name="github" size={16} />
                  <span className="text-sm">@sneha-iyer</span>
                  <Badge tone="success" className="ml-auto"><ShieldCheck className="size-3" /> Verified</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Usernames are confirmed by signing in with each provider — <Link href="/connections" className="text-primary hover:underline">manage on Connections</Link>.
              </p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Security" action={<User className="size-4 text-muted-foreground" />} bodyClassName="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted-foreground">Last changed 28 May 2026.</p>
            <Button asChild size="sm" variant="outline" className="mt-2 w-fit">
              <Link href="/reset-password">Change password</Link>
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">MFA support is coming in a future release to add an extra layer of account security.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
