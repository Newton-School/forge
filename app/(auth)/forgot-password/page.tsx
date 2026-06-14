import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a secure, single-use reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" action="/login">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@nst.edu" />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
          <Link href="/login" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
