import { ShieldX, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";
// Newton login/callback live at the server ROOT (/newton/*), not under /api.
const SERVER_ORIGIN = API.replace(/\/api\/?$/, "");
const SUPPORT = "learnercareercouncil@nst.rishihood.edu.in";

const ERRORS: Record<string, string> = {
  oauth_unconfigured: "Newton sign-in isn't configured on the server yet.",
  no_newton_account: "No Newton School account was found for that login.",
};

function NewtonButton({ label = "Sign in with Newton School" }: { label?: string }) {
  return (
    <Button asChild className="h-11 w-full gap-2.5 text-[15px]">
      <a href={`${SERVER_ORIGIN}/newton/login?next=/`}>{label}</a>
    </Button>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Dedicated access-denied state — the Newton account isn't provisioned in Forge.
  if (error === "denied") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-1 flex size-11 items-center justify-center rounded-full border border-danger/30 bg-danger-bg text-danger">
            <ShieldX className="size-5" />
          </span>
          <CardTitle className="text-base">Access denied</CardTitle>
          <CardDescription>
            Your Newton account isn&apos;t provisioned for Forge. Access is invite-only — sign in with the
            <strong> account that received your invitation</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="rounded-md border border-border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
            <li className="mb-1">• Use your <strong>Newton School</strong> account.</li>
            <li className="mb-1">• It must already be added by an Admin or the LCC.</li>
            <li>• Authenticating with Newton alone doesn&apos;t grant access.</li>
          </ul>
          <NewtonButton label="Try a different account" />
          <p className="text-center text-xs text-subtle-foreground">
            Think this is a mistake? Contact the LCC at{" "}
            <a href={`mailto:${SUPPORT}`} className="underline">{SUPPORT}</a>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const message = error ? ERRORS[error] ?? "Sign-in failed. Please try again." : null;
  return (
    <Card className="w-full max-w-sm shadow-sm">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg tracking-tight">Welcome to Forge</CardTitle>
        <CardDescription>
          Sign in with your Newton School account. No password, no signup — access is invite-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {message ? (
          <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{message}</p>
        ) : null}

        {/* Server-side auth: the browser is redirected to the server's /newton/login, which runs
            the Newton flow and creates the Forge session. No password, no signup. */}
        <NewtonButton />

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-subtle-foreground">
          <Lock className="size-3" />
          Secured by Newton School · Only pre-provisioned accounts
        </div>
      </CardContent>
    </Card>
  );
}
