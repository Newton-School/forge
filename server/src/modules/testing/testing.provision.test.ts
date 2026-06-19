import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";

// Mock the data layer + side-effecting collaborators so the test exercises pure orchestration.
const repo = {
  domainByKey: vi.fn(),
  upsertTeam: vi.fn(),
  setTeamMentor: vi.fn(),
  ensureUser: vi.fn(),
  ensureRole: vi.fn(),
  ensureMember: vi.fn(),
  testerIds: vi.fn(),
  existingTestTeams: vi.fn(),
  teardown: vi.fn(),
};
const inviteUser = vi.fn();
const audit = vi.fn();

vi.mock("./testing.repository.js", () => ({ testingRepo: repo }));
vi.mock("../invitations/invitations.service.js", () => ({ inviteUser }));
vi.mock("../../lib/audit.js", () => ({ audit }));

const { provisionDomain, endTesting } = await import("./testing.service.js");

const ADMIN: AuthContext = { id: "u-admin", email: "shaik.tajuddin2024@nst.rishihood.edu.in" } as AuthContext;
const TEACHER: AuthContext = { id: "u-t", email: "abhinav.choudhary2024@nst.rishihood.edu.in" } as AuthContext;

beforeEach(() => {
  vi.clearAllMocks();
  repo.domainByKey.mockResolvedValue({ id: "d-ml", key: "ML", name: "Machine Learning" });
  repo.upsertTeam.mockResolvedValue({ id: "t-test-ml", name: "ML Testing Team" });
  repo.setTeamMentor.mockResolvedValue({});
  repo.ensureRole.mockResolvedValue({});
  repo.ensureMember.mockResolvedValue({});
  // Default: nothing previously provisioned, so the auto-clear is a no-op.
  repo.testerIds.mockResolvedValue([]);
  repo.existingTestTeams.mockResolvedValue([]);
  repo.teardown.mockResolvedValue(0);
  // Everyone exists already except Khushi — so only Khushi should be invited (invite-once).
  repo.ensureUser.mockImplementation(async (email: string, fullName: string) => ({
    id: `id-${email}`, email, fullName, created: email.startsWith("khushi"),
  }));
});

describe("provisionDomain", () => {
  it("rejects a non-admin tester (real-email side effects stay behind the Testing Admin)", async () => {
    await expect(provisionDomain(TEACHER, "ML")).rejects.toHaveProperty("status", 403);
    expect(repo.ensureUser).not.toHaveBeenCalled();
    expect(inviteUser).not.toHaveBeenCalled();
  });

  it("404s when the domain is not seeded", async () => {
    repo.domainByKey.mockResolvedValue(null);
    await expect(provisionDomain(ADMIN, "ML")).rejects.toHaveProperty("status", 404);
  });

  it("provisions the roster, sets the primary mentor, and invites only newly-created accounts", async () => {
    const result = await provisionDomain(ADMIN, "ML");

    // 5 roster members upserted; team mentor set once (Aniket = primaryMentor).
    expect(repo.ensureUser).toHaveBeenCalledTimes(5);
    expect(repo.setTeamMentor).toHaveBeenCalledTimes(1);
    expect(repo.setTeamMentor).toHaveBeenCalledWith("t-test-ml", "id-aniket.pathak2024@nst.rishihood.edu.in");

    // Team Lead (Anwesha) maps to MENTOR, scoped to the team.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-anwesha.adhikari2024@nst.rishihood.edu.in", "MENTOR", "TEAM", "t-test-ml");
    // Teacher (Abhinav) is DOMAIN-scoped.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-abhinav.choudhary2024@nst.rishihood.edu.in", "TEACHER", "DOMAIN", "d-ml");
    // Mentee (Nikith) is SELF-scoped with a null scopeId.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-nikith.s2024@nst.rishihood.edu.in", "MENTEE", "SELF", null);

    // Invite-once: only Khushi was newly created, so exactly one email.
    expect(inviteUser).toHaveBeenCalledTimes(1);
    expect(inviteUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "khushi.2024@nst.rishihood.edu.in" }),
      expect.objectContaining({ role: "Mentee", domain: "Machine Learning", team: "ML Testing Team" }),
      ADMIN, undefined,
    );
    expect(result.members.filter((m) => m.invited).map((m) => m.email)).toEqual(["khushi.2024@nst.rishihood.edu.in"]);
    expect(audit).toHaveBeenCalled();
  });

  it("auto-clears a previously provisioned domain before starting a new one (one at a time)", async () => {
    repo.testerIds.mockResolvedValue([{ id: "old-1", email: "khushi.2024@nst.rishihood.edu.in" }]);
    repo.existingTestTeams.mockResolvedValue([{ id: "t-test-ai" }]);
    repo.teardown.mockResolvedValue(1);

    await provisionDomain(ADMIN, "ML");

    expect(repo.teardown).toHaveBeenCalledWith(["old-1"], ["t-test-ai"]);
  });
});

describe("endTesting", () => {
  it("rejects a non-admin tester", async () => {
    await expect(endTesting(TEACHER)).rejects.toHaveProperty("status", 403);
    expect(repo.teardown).not.toHaveBeenCalled();
  });

  it("tears down the provisioned roster + test teams and reports the count", async () => {
    repo.testerIds.mockResolvedValue([{ id: "u1", email: "a@x" }, { id: "u2", email: "b@x" }]);
    repo.existingTestTeams.mockResolvedValue([{ id: "t-test-ml" }]);
    repo.teardown.mockResolvedValue(2);

    const r = await endTesting(ADMIN);

    expect(repo.teardown).toHaveBeenCalledWith(["u1", "u2"], ["t-test-ml"]);
    expect(r).toEqual({ removedUsers: 2, removedTeams: 1 });
    expect(audit).toHaveBeenCalledWith(ADMIN, expect.objectContaining({ action: "testing:teardown" }));
  });

  it("is a no-op when nothing is provisioned", async () => {
    repo.testerIds.mockResolvedValue([]);
    repo.existingTestTeams.mockResolvedValue([]);

    const r = await endTesting(ADMIN);

    expect(repo.teardown).not.toHaveBeenCalled();
    expect(r).toEqual({ removedUsers: 0, removedTeams: 0 });
  });
});
