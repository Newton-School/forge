import { describe, it, expect } from "vitest";
import { canWriteConfigScope, configReadWhere } from "./config.access.js";

describe("config.access — write rules", () => {
  const global = { global: true, domainIds: [] };
  const teacher = { global: false, domainIds: ["d-ai", "d-ml"] };

  it("a global role may write any config (all-domain or domain-scoped)", () => {
    expect(canWriteConfigScope(global, null)).toBe(true);
    expect(canWriteConfigScope(global, "d-ai")).toBe(true);
    expect(canWriteConfigScope(global, "d-other")).toBe(true);
  });

  it("a domain role may write only its own domains, never all-domain config", () => {
    expect(canWriteConfigScope(teacher, null)).toBe(false);
    expect(canWriteConfigScope(teacher, "d-ai")).toBe(true);
    expect(canWriteConfigScope(teacher, "d-ml")).toBe(true);
    expect(canWriteConfigScope(teacher, "d-sdse")).toBe(false);
  });
});

describe("config.access — read filter", () => {
  it("global roles read everything (empty filter)", () => {
    expect(configReadWhere({ global: true, domainIds: [] })).toEqual({});
  });

  it("domain roles read all-domain config plus their own domains", () => {
    expect(configReadWhere({ global: false, domainIds: ["d-ai"] })).toEqual({
      OR: [{ domainId: null }, { domainId: { in: ["d-ai"] } }],
    });
  });

  it("a scopeless role reads only all-domain config", () => {
    expect(configReadWhere({ global: false, domainIds: [] })).toEqual({ OR: [{ domainId: null }] });
  });
});
