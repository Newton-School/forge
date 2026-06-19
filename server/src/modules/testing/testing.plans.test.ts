import { describe, it, expect } from "vitest";
import { buildPlan, TEST_PLAN_SEED } from "./testing.plans.data.js";

const GROUP_ORDER = ["User Management", "Teacher", "Mentor", "GitHub Integration", "Team Delivery", "Mentee", "Discord Integration", "Calendar Integration", "Notifications"];

describe("test plan seed", () => {
  it("builds one plan per domain", () => {
    expect(TEST_PLAN_SEED.map((p) => p.domainKey)).toEqual(["AI", "ML", "DVA", "SDSE"]);
  });

  it("never uses a 'Team Lead' role — the mock team-lead steps map to MENTOR", () => {
    for (const plan of TEST_PLAN_SEED) {
      expect(plan.steps.some((s) => /team lead/i.test(s.role))).toBe(false);
      // the two former team-lead steps are present, now as Mentor
      const lead = plan.steps.filter((s) => s.stepKey.includes("-tl-"));
      expect(lead).toHaveLength(2);
      expect(lead.every((s) => s.role === "Mentor")).toBe(true);
    }
  });

  it("orders steps by group and gives every step a stable domain-prefixed key", () => {
    const plan = buildPlan("AI");
    const ranks = plan.steps.map((s) => GROUP_ORDER.indexOf(s.group));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b)); // non-decreasing
    expect(plan.steps.every((s) => s.stepKey.startsWith("AI-"))).toBe(true);
  });
});
