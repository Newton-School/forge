import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const ERRORS: Record<string, string> = {
  denied: "That account isn't allowed. Use your institute Google account that's already been added to Forge.",
  oauth_unconfigured: "Google sign-in isn't configured on the server yet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
        <Button asChild className="w-full gap-2">
          <a href={`${API}/auth/google`}>
            <span className="flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#4285F4]">G</span>
            Continue with Google
          </a>
        </Button>

        <p className="text-center text-xs text-subtle-foreground">
          Only pre-provisioned institute emails can sign in.
        </p>
      </CardContent>
    </Card>
  );
}
