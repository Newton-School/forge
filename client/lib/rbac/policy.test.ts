import { describe, it, expect } from "vitest";
import { can } from "./policy";
import type { AuthUser } from "@/lib/types";

const admin: AuthUser = { id: "a", fullName: "Admin", email: "a@x", role: "ADMIN", scopes: [{ type: "GLOBAL" }] };
const mentee: AuthUser = { id: "m", fullName: "Mentee", email: "m@x", role: "MENTEE", scopes: [{ type: "SELF" }] };
const mentor: AuthUser = { id: "t", fullName: "Mentor", email: "t@x", role: "MENTOR", scopes: [{ type: "TEAM", id: "team-1" }] };

describe("rbac/can — role grants", () => {
  it("admin can create users; mentee cannot", () => {
    expect(can(admin, "user:create")).toBe(true);
    expect(can(mentee, "user:create")).toBe(false);
  });

  it("mentee can submit their own L1 update; admin role lacks that action", () => {
    expect(can(mentee, "menteeUpdate:submit")).toBe(true);
    expect(can(admin, "menteeUpdate:submit")).toBe(false);
  });

  it("null/undefined user is always denied", () => {
    expect(can(null, "user:create")).toBe(false);
    expect(can(undefined, "concern:raise")).toBe(false);
  });
});

describe("rbac/can — scope isolation", () => {
  it("a team-scoped mentor is allowed on their team but blocked on another team", () => {
    expect(can(mentor, "task:assign", { scopeType: "TEAM", teamId: "team-1" })).toBe(true);
    expect(can(mentor, "task:assign", { scopeType: "TEAM", teamId: "team-2" })).toBe(false);
  });

  it("admin's GLOBAL scope covers any resource", () => {
    expect(can(admin, "team:manage", { scopeType: "TEAM", teamId: "anything" })).toBe(true);
  });

  it("mentee SELF scope only covers resources they own", () => {
    expect(can(mentee, "task:updateOwn", { scopeType: "SELF", ownerId: "m" })).toBe(true);
    expect(can(mentee, "task:updateOwn", { scopeType: "SELF", ownerId: "someone-else" })).toBe(false);
  });
});
