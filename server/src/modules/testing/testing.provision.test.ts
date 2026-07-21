import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";
import { __setTestingPortalConfigForTest } from "./testing.config.js";

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

const ADMIN: AuthContext = { id: "u-admin", email: "admin@example.test" } as AuthContext;
const TEACHER: AuthContext = { id: "u-t", email: "teacher@example.test" } as AuthContext;

beforeEach(() => {
  vi.clearAllMocks();
  // Roster + allowlist are config-driven; inject a PII-free config. admin@example.test is the
  // Testing Admin; teacher@example.test is a tester but NOT an admin (so it's rejected as non-admin).
  __setTestingPortalConfigForTest({
    enabled: true,
    adminEmails: new Set(["admin@example.test"]),
    allowlist: new Set(["admin@example.test", "teacher@example.test"]),
    roster: [
      { email: "teacher@example.test", fullName: "Test Teacher", role: "TEACHER", scope: "DOMAIN", roleLabel: "the Teacher" },
      { email: "mentor1@example.test", fullName: "Test Mentor One", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", primaryMentor: true, roleLabel: "the Primary Mentor" },
      { email: "mentor2@example.test", fullName: "Test Mentor Two", role: "MENTOR", scope: "TEAM", memberRole: "Mentor", roleLabel: "the Co-Mentor" },
      { email: "mentee1@example.test", fullName: "Test Mentee One", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee 1" },
      { email: "mentee2@example.test", fullName: "Test Mentee Two", role: "MENTEE", scope: "SELF", memberRole: "Mentee", roleLabel: "Mentee 2" },
    ],
  });
  repo.domainByKey.mockResolvedValue({ id: "d-ml", key: "ML", name: "Machine Learning" });
  repo.upsertTeam.mockResolvedValue({ id: "t-test-ml", name: "ML Testing Team" });
  repo.setTeamMentor.mockResolvedValue({});
  repo.ensureRole.mockResolvedValue({});
  repo.ensureMember.mockResolvedValue({});
  // Default: nothing previously provisioned, so the auto-clear is a no-op.
  repo.testerIds.mockResolvedValue([]);
  repo.existingTestTeams.mockResolvedValue([]);
  repo.teardown.mockResolvedValue(0);
  // Everyone exists already except Mentee 1 — so only Mentee 1 should be invited (invite-once).
  repo.ensureUser.mockImplementation(async (email: string, fullName: string) => ({
    id: `id-${email}`, email, fullName, created: email.startsWith("mentee1"),
  }));
});
afterEach(() => __setTestingPortalConfigForTest(null));

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

    // 5 roster members upserted; team mentor set once (the Primary Mentor = primaryMentor).
    expect(repo.ensureUser).toHaveBeenCalledTimes(5);
    expect(repo.setTeamMentor).toHaveBeenCalledTimes(1);
    expect(repo.setTeamMentor).toHaveBeenCalledWith("t-test-ml", "id-mentor1@example.test");

    // The Co-Mentor maps to MENTOR, scoped to the team.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-mentor2@example.test", "MENTOR", "TEAM", "t-test-ml");
    // The Teacher is DOMAIN-scoped.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-teacher@example.test", "TEACHER", "DOMAIN", "d-ml");
    // Mentee 2 is SELF-scoped with a null scopeId.
    expect(repo.ensureRole).toHaveBeenCalledWith("id-mentee2@example.test", "MENTEE", "SELF", null);

    // Invite-once: only Mentee 1 was newly created, so exactly one email.
    expect(inviteUser).toHaveBeenCalledTimes(1);
    expect(inviteUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "mentee1@example.test" }),
      expect.objectContaining({ role: "Mentee 1", domain: "Machine Learning", team: "ML Testing Team" }),
      ADMIN, undefined,
    );
    expect(result.members.filter((m) => m.invited).map((m) => m.email)).toEqual(["mentee1@example.test"]);
    expect(audit).toHaveBeenCalled();
  });

  it("auto-clears a previously provisioned domain before starting a new one (one at a time)", async () => {
    repo.testerIds.mockResolvedValue([{ id: "old-1", email: "mentee1@example.test" }]);
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
