import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";

const repo = {
  planStepCount: vi.fn(),
  upsertProgress: vi.fn((_e: string, _d: string, data: unknown) => Promise.resolve(data)),
};
vi.mock("./testing.repository.js", () => ({ testingRepo: repo }));

const { saveProgress } = await import("./testing.service.js");
const TESTER: AuthContext = { id: "u", email: "khushi.2024@nst.rishihood.edu.in" } as AuthContext;
const base = { done: [] as string[], skipped: [] as string[], current: 0, status: "NOT_STARTED" as const };

beforeEach(() => { vi.clearAllMocks(); repo.upsertProgress.mockImplementation((_e, _d, data) => Promise.resolve(data)); });

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
