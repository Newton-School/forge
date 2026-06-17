import { Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { USERS, DOMAINS, TEAMS } from "@/lib/api";
import type { MockUser } from "@/lib/api";

/**
 * Create / edit user fields — shared by the Admin and LCC onboarding flows. Creating a
 * user provisions the allowlist entry and (server-side) sends the Google-OAuth onboarding
 * invitation. Mentor is optional (relevant for mentees).
 */
export function UserFields({ user }: { user?: MockUser }) {
  const mentors = USERS.filter((u) => u.role === "MENTOR");
  // Edit-mode preselects: map the user's domain key / team name back to ids.
  const defaultDomainId = DOMAINS.find((d) => d.key === user?.domainKey)?.id;
  const defaultTeamId = TEAMS.find((t) => t.name === user?.team)?.id;
  return (
    <>
      <Field label="Full name">
        <Input name="fullName" placeholder="Jane Doe" defaultValue={user?.name} />
      </Field>
      <Field label="Email" hint="An onboarding invitation is emailed to this address">
        <Input name="email" type="email" placeholder="jane@nst.edu" defaultValue={user?.email} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role">
          <Select name="role" defaultValue={user?.role}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="LCC">LCC</SelectItem>
              <SelectItem value="TEACHER">Teacher</SelectItem>
              <SelectItem value="MENTOR">Mentor</SelectItem>
              <SelectItem value="MENTEE">Mentee</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={user?.status ?? "INVITED"}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INVITED">Pending Invitation</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DEACTIVATED">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Domain">
          <Select name="domainId" defaultValue={defaultDomainId}>
            <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Team" hint="Optional">
          <Select name="teamId" defaultValue={defaultTeamId}>
            <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
            <SelectContent>
              {TEAMS.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Mentor" hint="Optional — assign a mentor (for mentees)">
        <Select name="mentorId">
          <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
          <SelectContent>
            {mentors.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}{m.team ? ` · ${m.team}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}
