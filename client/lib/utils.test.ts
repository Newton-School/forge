import { describe, it, expect } from "vitest";
import { cn, initials, pct, shortDate } from "./utils";

describe("utils/cn", () => {
  it("merges and de-dupes conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe("text-sm font-medium");
  });
});

describe("utils/initials", () => {
  it("takes up to two uppercase initials", () => {
    expect(initials("Sneha Iyer")).toBe("SI");
    expect(initials("aniket")).toBe("A");
  });
});

describe("utils/pct + shortDate", () => {
  it("rounds and suffixes percent", () => {
    expect(pct(49.6)).toBe("50%");
  });
  it("formats a short date", () => {
    expect(shortDate("2026-06-12")).toMatch(/Jun/);
  });
});
