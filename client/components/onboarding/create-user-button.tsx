"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { UserFields } from "./user-fields";
import { submit } from "@/lib/api";

/**
 * Create-user action shared by Admin + LCC. On submit it provisions the account and
 * (server-side) sends the Google-OAuth onboarding invitation. Presentation-safe: in demo
 * mode `submit` resolves without a backend.
 */
export function CreateUserButton({ label = "Create User" }: { label?: string }) {
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
      <UserFields />
    </FormDialog>
  );
}
