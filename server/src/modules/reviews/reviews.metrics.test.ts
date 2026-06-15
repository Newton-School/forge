import { describe, it, expect } from "vitest";
import { blockerStreak, computeAutoFlag, deriveL2Status, hasBlocker, daysBetween } from "./reviews.metrics.js";

describe("hasBlocker", () => {
  it("treats placeholders as no blocker", () => {
    expect(hasBlocker("—")).toBe(false);
    expect(hasBlocker("")).toBe(false);
    expect(hasBlocker(null)).toBe(false);
    expect(hasBlocker("Merge conflict")).toBe(true);
  });
});

describe("blockerStreak (newest-first)", () => {
  it("counts consecutive recent blockers", () => {
    expect(blockerStreak([{ blocker: "x" }, { blocker: "y" }, { blocker: "—" }])).toBe(2);
    expect(blockerStreak([{ blocker: "—" }, { blocker: "x" }])).toBe(0);
    expect(blockerStreak([])).toBe(0);
  });
});

describe("computeAutoFlag", () => {
  it("NO_UPDATES wins when inactive", () => {
    expect(computeAutoFlag({ updatesThisWeek: 0, blockerStreak: 5, daysSinceUpdate: 6 })).toBe("NO_UPDATES");
  });
  it("REPEATED_BLOCKER at 3+", () => {
    expect(computeAutoFlag({ updatesThisWeek: 4, blockerStreak: 3, daysSinceUpdate: 1 })).toBe("REPEATED_BLOCKER");
  });
  it("CONSISTENCY_GAP under 3 updates", () => {
    expect(computeAutoFlag({ updatesThisWeek: 2, blockerStreak: 0, daysSinceUpdate: 1 })).toBe("CONSISTENCY_GAP");
  });
  it("NONE when healthy", () => {
    expect(computeAutoFlag({ updatesThisWeek: 3, blockerStreak: 0, daysSinceUpdate: 1 })).toBe("NONE");
  });
});

describe("deriveL2Status + daysBetween", () => {
  it("flags 4+ days inactive", () => {
    expect(deriveL2Status({ daysSinceUpdate: 4, updatesThisWeek: 0 })).toBe("NO_UPDATES_4PLUS");
    expect(deriveL2Status({ daysSinceUpdate: 1, updatesThisWeek: 3 })).toBe("DOING_WELL");
  });
  it("computes whole days", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    expect(daysBetween(now, new Date("2026-06-12T00:00:00Z"))).toBe(3);
    expect(daysBetween(now, null)).toBeGreaterThan(1000);
  });
});
