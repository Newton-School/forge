import Link from "next/link";
import { Mail, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import type { RoleKey } from "@/lib/types";

const ROLE_LABEL: Record<RoleKey, string> = {
  ADMIN: "Admin", LCC: "LCC", TEACHER: "Teacher", MENTOR: "Mentor", MENTEE: "Mentee",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile & Settings" description="Manage your account details and security." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Account" description="Your identity in the drive" bodyClassName="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-12"><AvatarFallback className="text-sm">{initials(user.fullName)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="size-3" /> {user.email}</p>
              </div>
              <Badge tone="primary" className="ml-auto">{ROLE_LABEL[user.role]}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" defaultValue={user.fullName} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled />
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm">Save changes</Button>
            </div>

            {/* Linked accounts are verified via OAuth on Connections, not typed here. */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle-foreground">Linked accounts</p>
              <p className="text-xs text-muted-foreground">
                GitHub and Discord are linked by signing in with each provider — <Link href="/connections" className="text-primary hover:underline">manage on Connections</Link>.
              </p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Security" action={<User className="size-4 text-muted-foreground" />} bodyClassName="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-sm font-medium"><ShieldCheck className="size-4 text-success" /> Google sign-in</p>
            <p className="text-xs text-muted-foreground">
              Your account is secured by Google — there is no separate password. Access is granted by the institute Google account on the allowlist.
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">2FA is managed on your Google account; app-level MFA may be added in a future release.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
