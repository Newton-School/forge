import { describe, it, expect } from "vitest";
import { parseDomains, inDomains, domainName, ALL_DOMAIN_KEYS } from "./domains";

describe("domains/parseDomains", () => {
  it("splits a comma list and trims", () => {
    expect(parseDomains("AI,ML")).toEqual(["AI", "ML"]);
    expect(parseDomains(" AI , ML ")).toEqual(["AI", "ML"]);
  });
  it("returns [] for empty / undefined", () => {
    expect(parseDomains(undefined)).toEqual([]);
    expect(parseDomains("")).toEqual([]);
  });
  it("flattens a string[] param", () => {
    expect(parseDomains(["AI", "ML"])).toEqual(["AI", "ML"]);
  });
});

describe("domains/inDomains", () => {
  it("empty selection means all domains pass", () => {
    expect(inDomains("AI", [])).toBe(true);
  });
  it("matches only selected keys", () => {
    expect(inDomains("AI", ["AI"])).toBe(true);
    expect(inDomains("AI", ["ML"])).toBe(false);
  });
  it("an undefined key never matches a non-empty selection", () => {
    expect(inDomains(undefined, ["AI"])).toBe(false);
  });
});

describe("domains/domainName + keys", () => {
  it("resolves a key to its display name, falls back to the key", () => {
    expect(domainName("AI")).toBe("Artificial Intelligence");
    expect(domainName("ZZ")).toBe("ZZ");
  });
  it("exposes the known domain keys", () => {
    expect(ALL_DOMAIN_KEYS).toContain("AI");
    expect(ALL_DOMAIN_KEYS).toContain("ML");
    expect(ALL_DOMAIN_KEYS).toContain("SDSE");
  });
});
