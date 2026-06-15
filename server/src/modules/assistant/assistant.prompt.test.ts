import { describe, it, expect } from "vitest";
import { buildSummaryMessages, clampPrompt } from "./assistant.prompt.js";

describe("buildSummaryMessages", () => {
  const updates = [
    { date: new Date("2026-06-14T10:00:00Z"), workedOn: "State mgmt", learning: "useContext", blocker: "Context API", nextGoal: "Todo app" },
    { date: new Date("2026-06-12T10:00:00Z"), workedOn: "Components", learning: "Props", blocker: null, nextGoal: "Navbar" },
  ];

  it("returns a system + user message and embeds the mentee and updates", () => {
    const msgs = buildSummaryMessages("Aniket", updates);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]!.role).toBe("system");
    expect(msgs[1]!.content).toContain("Mentee: Aniket");
    expect(msgs[1]!.content).toContain("2026-06-14: worked on State mgmt");
    expect(msgs[1]!.content).toContain("blocker: none"); // null → "none"
  });

  it("handles an empty update list gracefully", () => {
    expect(buildSummaryMessages("X", [])[1]!.content).toContain("(no updates)");
  });
});

describe("clampPrompt", () => {
  it("truncates only when over the cap", () => {
    expect(clampPrompt("abc", 10)).toBe("abc");
    expect(clampPrompt("abcdef", 3)).toBe("abc");
  });
});
