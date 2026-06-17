import { describe, it, expect } from "vitest";
import { can, effectiveScope } from "./policy.js";
import type { AuthContext } from "./types.js";

const admin: AuthContext = { id: "a", email: "a", fullName: "A", roles: [{ role: "ADMIN", scopeType: "GLOBAL", scopeId: null }] };
const teacher: AuthContext = {
  id: "t", email: "t", fullName: "T",
  roles: [{ role: "TEACHER", scopeType: "DOMAIN", scopeId: "d-ai" }, { role: "TEACHER", scopeType: "DOMAIN", scopeId: "d-ml" }],
};
const mentee: AuthContext = { id: "m", email: "m", fullName: "M", roles: [{ role: "MENTEE", scopeType: "SELF", scopeId: null }] };

describe("can() — role grants", () => {
  it("admin can create users; mentee cannot", () => {
    expect(can(admin, "user:create")).toBe(true);
    expect(can(mentee, "user:create")).toBe(false);
  });
  it("mentee can submit their own update", () => {
    expect(can(mentee, "menteeUpdate:submit")).toBe(true);
  });
  it("denies a null principal", () => {
    expect(can(null, "concern:raise")).toBe(false);
  });
});

describe("can() — domain scope isolation", () => {
  it("teacher can read a concern in their domain but not another", () => {
    expect(can(teacher, "concern:read", { scopeType: "DOMAIN", domainId: "d-ai" })).toBe(true);
    expect(can(teacher, "concern:read", { scopeType: "DOMAIN", domainId: "d-zzz" })).toBe(false);
  });
});

describe("can() — team & self scope isolation", () => {
  const mentor: AuthContext = { id: "mt", email: "mt", fullName: "MT", roles: [{ role: "MENTOR", scopeType: "TEAM", scopeId: "t1" }] };
  it("mentor reads their own team only", () => {
    expect(can(mentor, "review:read", { teamId: "t1" })).toBe(true);
    expect(can(mentor, "review:read", { teamId: "t2" })).toBe(false);
  });
  it("self scope covers the owner only, not a team resource", () => {
    expect(can(mentee, "review:read", { ownerId: "m" })).toBe(true);
    expect(can(mentee, "review:read", { ownerId: "other" })).toBe(false);
    expect(can(mentee, "review:read", { teamId: "t1" })).toBe(false);
  });
});

describe("effectiveScope()", () => {
  it("collects all of a multi-domain teacher's domains", () => {
    const s = effectiveScope(teacher);
    expect(s.global).toBe(false);
    expect(s.domainIds.sort()).toEqual(["d-ai", "d-ml"]);
  });
  it("marks admin as global", () => {
    expect(effectiveScope(admin).global).toBe(true);
  });
});
