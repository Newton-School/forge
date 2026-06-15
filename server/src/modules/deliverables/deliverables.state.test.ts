import { describe, it, expect } from "vitest";
import { applyReview, canReview } from "./deliverables.state.js";

describe("deliverables review state machine", () => {
  it("allows reviewing a PENDING deliverable", () => {
    expect(canReview("PENDING")).toBe(true);
    expect(applyReview("PENDING", "APPROVED")).toBe("APPROVED");
    expect(applyReview("PENDING", "REJECTED")).toBe("REJECTED");
  });

  it("forbids re-reviewing a terminal deliverable", () => {
    expect(canReview("APPROVED")).toBe(false);
    expect(canReview("REJECTED")).toBe(false);
    expect(() => applyReview("APPROVED", "REJECTED")).toThrow(/cannot be reviewed again/);
    expect(() => applyReview("REJECTED", "APPROVED")).toThrow(/cannot be reviewed again/);
  });
});
