import { describe, it, expect } from "vitest";
import { teamAccessAllowed } from "./github.service.js";
import { sessionExpired } from "../../middleware/auth.js";

const team = { id: "t1", domainId: "d-ai", mentorId: "mentor1", members: [{ userId: "stu1" }, { userId: "stu2" }] };
const none = { global: false, domainIds: [] as string[], teamIds: [] as string[] };

describe("teamAccessAllowed — membership-aware team isolation", () => {
  it("global (Admin/LCC) reaches any team", () => {
    expect(teamAccessAllowed({ ...none, global: true }, team, "anyone")).toBe(true);
  });
  it("teacher reaches teams in their domain", () => {
    expect(teamAccessAllowed({ ...none, domainIds: ["d-ai"] }, team, "teach")).toBe(true);
    expect(teamAccessAllowed({ ...none, domainIds: ["d-ml"] }, team, "teach")).toBe(false);
  });
  it("mentor reaches their team via grant or mentorId", () => {
    expect(teamAccessAllowed({ ...none, teamIds: ["t1"] }, team, "x")).toBe(true);
    expect(teamAccessAllowed(none, team, "mentor1")).toBe(true); // mentor of the team
  });
  it("a member (mentee) reaches their own team even with no team-scoped grant", () => {
    expect(teamAccessAllowed(none, team, "stu1")).toBe(true);
  });
  it("an unrelated user is denied", () => {
    expect(teamAccessAllowed(none, team, "stranger")).toBe(false);
  });
});

describe("sessionExpired — absolute lifetime cap", () => {
  const HOUR = 60 * 60 * 1000;
  const now = 1_000_000_000_000;
  it("is not expired within the window", () => {
    expect(sessionExpired(now - 2 * HOUR, now, 24 * HOUR)).toBe(false);
  });
  it("is expired past the window", () => {
    expect(sessionExpired(now - 25 * HOUR, now, 24 * HOUR)).toBe(true);
  });
  it("a session with no loginAt is never force-expired by this check", () => {
    expect(sessionExpired(undefined, now, 24 * HOUR)).toBe(false);
  });
});
