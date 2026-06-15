import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function FirstLoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-info-bg text-info">
          <ShieldCheck className="size-4.5" />
        </div>
        <CardTitle className="text-base">Change your password</CardTitle>
        <CardDescription>
          For security, you must set a new password before accessing the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" action="/">
          <div className="grid gap-1.5">
            <Label htmlFor="cur">Temporary password</Label>
            <Input id="cur" type="password" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new2">Confirm new password</Label>
            <Input id="new2" type="password" />
          </div>
          <Button type="submit" className="w-full">Set password &amp; continue</Button>
        </form>
      </CardContent>
    </Card>
  );
}
