import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";

// Capture the Prisma `where` the service builds, so we can assert a query param can never
// WIDEN a scoped read (the scope-override regression: ?teamId= must not overwrite the scope).
const repo = { list: vi.fn() };
vi.mock("./projects.repository.js", () => ({ projectsRepo: repo }));
vi.mock("../../lib/audit.js", () => ({ audit: vi.fn() }));

const { listProjects } = await import("./projects.service.js");

const MENTOR: AuthContext = {
  id: "u-mentor", email: "m", fullName: "M",
  roles: [{ role: "MENTOR", scopeType: "TEAM", scopeId: "t1" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.list.mockResolvedValue([]);
});

describe("listProjects — scope cannot be widened by query params", () => {
  it("ANDs ?teamId= with the caller's team scope (cross-team read denied)", async () => {
    await listProjects(MENTOR, { teamId: "t2", take: 50, skip: 0 } as never);
    const where = repo.list.mock.calls[0]![0] as { AND?: unknown[] };

    // The mentor's scope (team t1) must still be present alongside the requested t2,
    // so Prisma ANDs them → t1 ≠ t2 → no rows. The scope is NOT overwritten.
    expect(Array.isArray(where.AND)).toBe(true);
    expect(where.AND).toContainEqual({ teamId: { in: ["t1"] } });
    expect(where.AND).toContainEqual({ teamId: "t2" });
  });

  it("still scopes to the caller's team when no param is given", async () => {
    await listProjects(MENTOR, { take: 50, skip: 0 } as never);
    const where = repo.list.mock.calls[0]![0] as { AND?: unknown[] };
    expect(where.AND).toContainEqual({ teamId: { in: ["t1"] } });
  });
});
