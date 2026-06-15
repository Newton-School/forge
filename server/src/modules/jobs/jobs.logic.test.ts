import { describe, it, expect } from "vitest";
import { evaluateEscalations, ruleMetricValue, type EscalationRuleLite, type MenteeMetric } from "./jobs.logic.js";

const rule = (over: Partial<EscalationRuleLite>): EscalationRuleLite => ({
  id: "r", name: "rule", thresholdValue: 3, thresholdUnit: "days", action: "FLAG", severity: null, targetRole: null, domainId: null, ...over,
});
const mentee = (over: Partial<MenteeMetric>): MenteeMetric => ({
  menteeId: "m", domainId: "d-ai", daysSinceUpdate: 0, blockerStreak: 0, updatesThisWeek: 3, ...over,
});

describe("ruleMetricValue", () => {
  it("maps unit → metric (hours scales days×24)", () => {
    const m = mentee({ daysSinceUpdate: 2, blockerStreak: 4 });
    expect(ruleMetricValue(rule({ thresholdUnit: "days" }), m)).toBe(2);
    expect(ruleMetricValue(rule({ thresholdUnit: "hours" }), m)).toBe(48);
    expect(ruleMetricValue(rule({ thresholdUnit: "updates" }), m)).toBe(4);
  });
});

describe("evaluateEscalations", () => {
  it("fires when the metric meets the threshold", () => {
    const out = evaluateEscalations([mentee({ daysSinceUpdate: 5 })], [rule({ thresholdValue: 3 })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ menteeId: "m", ruleId: "r", action: "FLAG" });
  });

  it("does not fire below the threshold", () => {
    expect(evaluateEscalations([mentee({ daysSinceUpdate: 2 })], [rule({ thresholdValue: 3 })])).toEqual([]);
  });

  it("respects domain scoping (all-domain vs specific)", () => {
    const m = mentee({ daysSinceUpdate: 5, domainId: "d-ai" });
    expect(evaluateEscalations([m], [rule({ domainId: "d-ml" })])).toEqual([]);
    expect(evaluateEscalations([m], [rule({ domainId: "d-ai" })])).toHaveLength(1);
    expect(evaluateEscalations([m], [rule({ domainId: null })])).toHaveLength(1);
  });

  it("emits one outcome per firing rule across mentees", () => {
    const out = evaluateEscalations(
      [mentee({ menteeId: "a", daysSinceUpdate: 5, blockerStreak: 3 })],
      [rule({ id: "noupd", thresholdValue: 3, thresholdUnit: "days" }), rule({ id: "blk", thresholdValue: 3, thresholdUnit: "updates" })],
    );
    expect(out.map((o) => o.ruleId).sort()).toEqual(["blk", "noupd"]);
  });
});
