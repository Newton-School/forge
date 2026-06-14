import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you haven&apos;t used before.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" action="/login">
          <div className="grid gap-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pw2">Confirm password</Label>
            <Input id="pw2" type="password" />
          </div>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
