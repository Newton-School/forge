import { ShieldX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const SUPPORT = "learnercareercouncil@nst.rishihood.edu.in";

const ERRORS: Record<string, string> = {
  oauth_unconfigured: "Google sign-in isn't configured on the server yet.",
};

function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Button asChild className="w-full gap-2">
      <a href={`${API}/auth/google`}>
        <span className="flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#4285F4]">G</span>
        {label}
      </a>
    </Button>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Dedicated access-denied state — the Google account isn't provisioned in Forge.
  if (error === "denied") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-1 flex size-11 items-center justify-center rounded-full border border-danger/30 bg-danger-bg text-danger">
            <ShieldX className="size-5" />
          </span>
          <CardTitle className="text-base">Access denied</CardTitle>
          <CardDescription>
            Your Google account isn&apos;t provisioned for Forge. Access is invite-only — sign in with the
            <strong> institute email that received your invitation</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="rounded-md border border-border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
            <li className="mb-1">• Use your <strong>@rishihood.edu.in</strong> Google account.</li>
            <li className="mb-1">• It must already be added by an Admin or the LCC.</li>
            <li>• Authenticating with Google alone doesn&apos;t grant access.</li>
          </ul>
          <GoogleButton label="Try a different account" />
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Sign in to Forge</CardTitle>
        <CardDescription>Use your institute Google account. Access is invite-only.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message ? (
          <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{message}</p>
        ) : null}

        {/* Server-side OAuth: the browser is redirected to the API, which runs the
            Google OIDC flow and creates the session. No password, no signup. */}
        <GoogleButton />

        <p className="text-center text-xs text-subtle-foreground">
          Only pre-provisioned institute emails can sign in.
        </p>
      </CardContent>
    </Card>
  );
}
