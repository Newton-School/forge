import { describe, it, expect } from "vitest";
import { calendarReadWhere, canCreateEvent } from "./calendar.access.js";

const global = { global: true, domainIds: [], teamIds: [], self: false };
const teacher = { global: false, domainIds: ["d-ai"], teamIds: [], self: true };
const mentor = { global: false, domainIds: [], teamIds: ["t-1"], self: true };

describe("calendarReadWhere", () => {
  it("global roles read everything", () => {
    expect(calendarReadWhere(global, "u1")).toEqual({});
  });
  it("others read GLOBAL + their domain/team + own personal events", () => {
    expect(calendarReadWhere(teacher, "u1")).toEqual({
      OR: [
        { scopeType: "GLOBAL" },
        { scopeType: "DOMAIN", scopeId: { in: ["d-ai"] } },
        { scopeType: "PERSONAL", scopeId: "u1" },
      ],
    });
  });
});

describe("canCreateEvent", () => {
  it("anyone can create PERSONAL events", () => {
    expect(canCreateEvent(mentor, "PERSONAL", null)).toBe(true);
  });
  it("only global roles create GLOBAL events", () => {
    expect(canCreateEvent(global, "GLOBAL", null)).toBe(true);
    expect(canCreateEvent(teacher, "GLOBAL", null)).toBe(false);
  });
  it("DOMAIN/TEAM events require ownership of that scope", () => {
    expect(canCreateEvent(teacher, "DOMAIN", "d-ai")).toBe(true);
    expect(canCreateEvent(teacher, "DOMAIN", "d-ml")).toBe(false);
    expect(canCreateEvent(mentor, "TEAM", "t-1")).toBe(true);
    expect(canCreateEvent(mentor, "TEAM", "t-9")).toBe(false);
    expect(canCreateEvent(global, "TEAM", "t-9")).toBe(true);
  });
});
