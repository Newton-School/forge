import { describe, it, expect } from "vitest";
import { buildPlan, TEST_PLAN_SEED } from "./testing.plans.data.js";

const GROUP_ORDER = [
  "User Management", "Team Setup", "GitHub Setup", "Teacher", "Mentor", "Mentee",
  "GitHub Validation", "Concerns & Demerits", "Discord Integration", "Calendar Integration", "Notifications",
];

describe("test plan seed", () => {
  it("builds one plan per domain", () => {
    expect(TEST_PLAN_SEED.map((p) => p.domainKey)).toEqual(["AI", "ML", "DVA", "SDSE"]);
  });

  it("never uses a 'Team Lead' role and exercises two distinct mentors", () => {
    for (const plan of TEST_PLAN_SEED) {
      expect(plan.steps.some((s) => /team lead/i.test(s.role))).toBe(false);
      // Two separate mentor reviews — Aniket for Khushi, Anwesha for Nikith — prove two mentors.
      const reviews = plan.steps.filter((s) => /-m-review[12]$/.test(s.stepKey));
      expect(reviews).toHaveLength(2);
      expect(reviews.every((s) => s.role === "Mentor")).toBe(true);
    }
  });

  it("steps name specific people and concrete paths", () => {
    const plan = buildPlan("ML");
    const text = plan.steps.map((s) => s.instruction).join(" ");
    // The two mentees are disambiguated by name (not just "Mentee").
    expect(text).toMatch(/Khushi/);
    expect(text).toMatch(/Nikith/);
    // Steps reference concrete app routes and the GitHub setup.
    expect(text).toMatch(/\/mentee\/github/);
    expect(text).toMatch(/GitHub\.com/);
    // Most steps point at a route or github.com so the tester knows where to go.
    const located = plan.steps.filter((s) => /\(\/[a-z]|GitHub\.com/.test(s.instruction));
    expect(located.length).toBeGreaterThan(plan.steps.length / 2);
  });

  it("orders steps by group and gives every step a stable domain-prefixed key", () => {
    const plan = buildPlan("AI");
    const ranks = plan.steps.map((s) => GROUP_ORDER.indexOf(s.group));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b)); // non-decreasing
    expect(plan.steps.every((s) => s.stepKey.startsWith("AI-"))).toBe(true);
  });
});
