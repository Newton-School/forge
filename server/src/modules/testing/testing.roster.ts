/**
 * The fixed tester roster provisioned per domain when the Testing Admin starts testing.
 *
 * The roster is HARDCODED (closed set) — provisioning can never create arbitrary accounts,
 * only these five known testers, which is what makes it safe to expose to the testing flow.
 * The mock's "Team Lead" maps to the real MENTOR role (there is no Team Lead role — the
 * Student Mentor leads the team), so the team carries two mentors: Aniket as the primary
 * `team.mentorId`, Anwesha as a co-mentor.
 */
import type { RoleKey, ScopeType } from "@prisma/client";

export interface RosterMember {
  email: string;
  fullName: string;
  role: RoleKey; // RBAC grant
  scope: ScopeType; // DOMAIN (teacher) · TEAM (mentor) · SELF (mentee)
  memberRole?: string; // TeamMember.memberRole — omitted for the domain-scoped teacher
  primaryMentor?: boolean; // becomes team.mentorId
  roleLabel: string; // onboarding-email label
}

/** The five domain testers (Admin + LCC are already seeded globally and are not re-invited). */
export const TESTER_ROSTER: RosterMember[] = [
  { email: "abhinav.choudhary2024@nst.rishihood.edu.in", fullName: "Abhinav Choudhary", role: "TEACHER", scope: "DOMAIN", roleLabel: "Teacher" },
  { email: "aniket.pathak2024@nst.rishihood.edu.in", fullName: "Aniket Pathak", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", primaryMentor: true, roleLabel: "Mentor" },
  { email: "anwesha.adhikari2024@nst.rishihood.edu.in", fullName: "Anwesha Adhikari", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", roleLabel: "Mentor" },
  { email: "khushi.2024@nst.rishihood.edu.in", fullName: "Khushi", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee" },
  { email: "nikith.s2024@nst.rishihood.edu.in", fullName: "Nikith S", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee" },
];

/** Stable per-domain team id + name (idempotent across repeated provisioning). */
export const teamIdFor = (domainKey: string): string => `t-test-${domainKey.toLowerCase()}`;
export const teamNameFor = (domainKey: string): string => `${domainKey} Testing Team`;

export const ALL_DOMAIN_KEYS = ["AI", "ML", "DVA", "SDSE"] as const;
/** Every email this roster can provision — the closed set teardown is allowed to delete. */
export const ROSTER_EMAILS = TESTER_ROSTER.map((m) => m.email);
/** Every possible test-team id (one per domain) — used to find what to tear down. */
export const ALL_TEST_TEAM_IDS = ALL_DOMAIN_KEYS.map(teamIdFor);
