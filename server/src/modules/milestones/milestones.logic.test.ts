import { describe, it, expect } from "vitest";
import { clampPct, deriveStatus } from "./milestones.logic.js";

describe("milestones.logic", () => {
  it("clamps percentages into [0,100] and rounds", () => {
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(150)).toBe(100);
    expect(clampPct(42.6)).toBe(43);
    expect(clampPct(Number.NaN)).toBe(0);
  });

  it("derives TODO / IN_PROGRESS from partial completion", () => {
    expect(deriveStatus(0, false)).toBe("TODO");
    expect(deriveStatus(1, false)).toBe("IN_PROGRESS");
    expect(deriveStatus(99, false)).toBe("IN_PROGRESS");
  });

  it("a 100% but unsigned milestone awaits review", () => {
    expect(deriveStatus(100, false)).toBe("IN_REVIEW");
  });

  it("a signed-off milestone is DONE regardless of completion", () => {
    expect(deriveStatus(0, true)).toBe("DONE");
    expect(deriveStatus(100, true)).toBe("DONE");
  });
});
