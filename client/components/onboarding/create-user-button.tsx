"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { UserFields } from "./user-fields";
import { submit } from "@/lib/api";
import type { MockDomain, MockTeam, MockUser } from "@/lib/api";

/**
 * Create-user action shared by Admin + LCC. On submit it provisions the account and
 * (server-side) sends the Google-OAuth onboarding invitation. Presentation-safe: in demo
 * mode `submit` resolves without a backend. Option lists are supplied by the server page.
 */
export function CreateUserButton({
  label = "Create User",
  domains,
  teams,
  mentors,
}: {
  label?: string;
  domains: MockDomain[];
  teams: MockTeam[];
  mentors: MockUser[];
}) {
  return (
    <FormDialog
      trigger={<Button size="sm"><Plus />{label}</Button>}
      title="Create user"
      description="Provisions the account and emails a Google-OAuth onboarding invitation."
      submitLabel="Create & send invite"
      onSubmit={async (data) => {
        await submit("/users", "POST", Object.fromEntries(data));
      }}
    >
      <UserFields domains={domains} teams={teams} mentors={mentors} />
    </FormDialog>
  );
}
