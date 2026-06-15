import { describe, it, expect } from "vitest";
import { canTransition, allowedTransitions } from "./concerns.state.js";

describe("concern lifecycle state machine", () => {
  it("allows valid forward transitions", () => {
    expect(canTransition("OPEN", "ACKNOWLEDGED")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    expect(canTransition("RESOLVED", "REOPENED")).toBe(true);
  });
  it("rejects illegal jumps", () => {
    expect(canTransition("OPEN", "RESOLVED")).toBe(false);
    expect(canTransition("OPEN", "CLOSED")).toBe(false);
  });
  it("CLOSED is terminal", () => {
    expect(allowedTransitions("CLOSED")).toEqual([]);
    expect(canTransition("CLOSED", "REOPENED")).toBe(false);
  });
  it("any state can escalate except resolved/closed", () => {
    expect(canTransition("ACKNOWLEDGED", "ESCALATED")).toBe(true);
    expect(canTransition("RESOLVED", "ESCALATED")).toBe(false);
  });
});
