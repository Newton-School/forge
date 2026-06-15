import { describe, it, expect } from "vitest";
import { percent, rollupDomains, totals } from "./analytics.logic.js";

describe("analytics.logic — percent", () => {
  it("rounds and clamps, and avoids divide-by-zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
    expect(percent(5, 0)).toBe(0);
    expect(percent(10, 10)).toBe(100);
    expect(percent(-1, 10)).toBe(0);
  });
});

describe("analytics.logic — rollupDomains / totals", () => {
  const domains = [
    { id: "d-ai", key: "AI", name: "Artificial Intelligence" },
    { id: "d-ml", key: "ML", name: "Machine Learning" },
  ];
  const teams = [
    { domainId: "d-ai", members: 5, hasMentor: true },
    { domainId: "d-ai", members: 4, hasMentor: false },
    { domainId: "d-ml", members: 6, hasMentor: true },
  ];

  it("counts teams, students and mentors per domain", () => {
    const r = rollupDomains(domains, teams);
    expect(r[0]).toMatchObject({ key: "AI", teams: 2, students: 9, mentors: 1 });
    expect(r[1]).toMatchObject({ key: "ML", teams: 1, students: 6, mentors: 1 });
  });

  it("a domain with no teams rolls up to zeros", () => {
    const r = rollupDomains([{ id: "d-x", key: "X", name: "Empty" }], teams);
    expect(r[0]).toMatchObject({ teams: 0, students: 0, mentors: 0 });
  });

  it("totals sum the per-domain rollups", () => {
    expect(totals(rollupDomains(domains, teams))).toEqual({ domains: 2, teams: 3, students: 15, mentors: 2 });
  });
});
