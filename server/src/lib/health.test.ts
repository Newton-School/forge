import { describe, it, expect } from "vitest";
import { healthPayload } from "./health.js";

describe("healthPayload", () => {
  it("reports ok for the forge-server", () => {
    const p = healthPayload(new Date("2026-06-15T00:00:00.000Z"));
    expect(p.status).toBe("ok");
    expect(p.service).toBe("forge-server");
    expect(p.time).toBe("2026-06-15T00:00:00.000Z");
  });
});
