import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";
import { __setTestingPortalConfigForTest } from "./testing.config.js";

const repo = {
  planStepCount: vi.fn(),
  upsertProgress: vi.fn((_e: string, _d: string, data: unknown) => Promise.resolve(data)),
};
vi.mock("./testing.repository.js", () => ({ testingRepo: repo }));

const { saveProgress } = await import("./testing.service.js");
const TESTER: AuthContext = { id: "u", email: "mentee1@example.test" } as AuthContext;
const base = { done: [] as string[], skipped: [] as string[], current: 0, status: "NOT_STARTED" as const };

// The tester allowlist + roster are now config-driven; inject a PII-free config so the tester
// (mentee1@example.test) is recognized and the portal is enabled for these tests.
beforeEach(() => {
  vi.clearAllMocks();
  repo.upsertProgress.mockImplementation((_e, _d, data) => Promise.resolve(data));
  __setTestingPortalConfigForTest({
    enabled: true,
    adminEmails: new Set(["admin@example.test"]),
    allowlist: new Set(["admin@example.test", "mentee1@example.test"]),
    roster: [
      { email: "teacher@example.test", fullName: "Test Teacher", role: "TEACHER", scope: "DOMAIN", roleLabel: "the Teacher" },
      { email: "mentor1@example.test", fullName: "Test Mentor One", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", primaryMentor: true, roleLabel: "the Primary Mentor" },
      { email: "mentor2@example.test", fullName: "Test Mentor Two", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", roleLabel: "the Co-Mentor" },
      { email: "mentee1@example.test", fullName: "Test Mentee One", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee 1" },
      { email: "mentee2@example.test", fullName: "Test Mentee Two", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee 2" },
    ],
  });
});
afterEach(() => __setTestingPortalConfigForTest(null));

describe("saveProgress — server-authoritative status", () => {
  it("marks COMPLETED when every plan step is handled", async () => {
    repo.planStepCount.mockResolvedValue(3);
    const r = await saveProgress(TESTER, "AI", { ...base, done: ["a", "b"], skipped: ["c"] });
    expect(r).toMatchObject({ status: "COMPLETED" });
  });

  it("marks IN_PROGRESS on partial progress", async () => {
    repo.planStepCount.mockResolvedValue(3);
    const r = await saveProgress(TESTER, "AI", { ...base, done: ["a"], current: 1 });
    expect(r).toMatchObject({ status: "IN_PROGRESS" });
  });

  it("marks NOT_STARTED with no progress", async () => {
    repo.planStepCount.mockResolvedValue(3);
    const r = await saveProgress(TESTER, "AI", { ...base });
    expect(r).toMatchObject({ status: "NOT_STARTED" });
  });

  it("falls back to the client status when the plan isn't seeded (count 0)", async () => {
    repo.planStepCount.mockResolvedValue(0);
    const r = await saveProgress(TESTER, "AI", { ...base, status: "IN_PROGRESS", done: ["a"] });
    expect(r).toMatchObject({ status: "IN_PROGRESS" });
  });
});
