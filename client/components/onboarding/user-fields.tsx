import { Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { MockUser, MockDomain, MockTeam } from "@/lib/api";

/**
 * Create / edit user fields — shared by the Admin and LCC onboarding flows. Presentational:
 * the option lists (domains, teams, mentors) are passed in by the server page so this works
 * identically against fixtures or the live API. Creating a user provisions the allowlist
 * entry and (server-side) sends the Google-OAuth onboarding invitation.
 */
export function UserFields({
  user,
  domains,
  teams,
  mentors,
}: {
  user?: MockUser;
  domains: MockDomain[];
  teams: MockTeam[];
  mentors: MockUser[];
}) {
  // Edit-mode preselects: map the user's domain key / team name back to ids.
  const defaultDomainId = domains.find((d) => d.key === user?.domainKey)?.id;
  const defaultTeamId = teams.find((t) => t.name === user?.team)?.id;
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
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Team" hint="Optional">
          <Select name="teamId" defaultValue={defaultTeamId}>
            <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
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
