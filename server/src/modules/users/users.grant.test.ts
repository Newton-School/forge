import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthContext } from "../../rbac/types.js";

// Regression: an LCC (who holds role:assign) must NOT be able to elevate anyone to Admin or to a
// GLOBAL scope — only a real Admin may grant those. Guard lives in assignRole/createUser.
const repo = { findById: vi.fn(), addRole: vi.fn() };
vi.mock("./users.repository.js", () => ({ usersRepo: repo }));
vi.mock("../invitations/invitations.service.js", () => ({ inviteUser: vi.fn(), resendForUser: vi.fn() }));
vi.mock("../../lib/audit.js", () => ({ audit: vi.fn() }));

const { assignRole } = await import("./users.service.js");

const LCC: AuthContext = { id: "lcc", email: "l", fullName: "L", roles: [{ role: "LCC", scopeType: "GLOBAL", scopeId: null }] };
const ADMIN: AuthContext = { id: "adm", email: "a", fullName: "A", roles: [{ role: "ADMIN", scopeType: "GLOBAL", scopeId: null }] };

beforeEach(() => {
  vi.clearAllMocks();
  repo.findById.mockResolvedValue({ id: "victim", roles: [] });
});

describe("assignRole — privilege-escalation guard", () => {
  it("blocks an LCC from granting the Admin role", async () => {
    await expect(assignRole(LCC, "victim", { role: "ADMIN", scopeType: "DOMAIN", scopeId: "d-ai" } as never))
      .rejects.toThrow(/Admin/i);
    expect(repo.addRole).not.toHaveBeenCalled();
  });

  it("blocks an LCC from granting GLOBAL scope", async () => {
    await expect(assignRole(LCC, "victim", { role: "TEACHER", scopeType: "GLOBAL", scopeId: null } as never))
      .rejects.toThrow(/global/i);
    expect(repo.addRole).not.toHaveBeenCalled();
  });

  it("allows an Admin to grant the Admin role", async () => {
    repo.addRole.mockResolvedValue({});
    repo.findById.mockResolvedValue({
      id: "victim", email: "v@x", fullName: "V", status: "ACTIVE", avatarUrl: null,
      githubUsername: null, discordUsername: null, roles: [], teamMemberships: [],
      lastLoginAt: null, createdAt: new Date(),
    });
    await expect(assignRole(ADMIN, "victim", { role: "ADMIN", scopeType: "GLOBAL", scopeId: null } as never))
      .resolves.toBeDefined();
    expect(repo.addRole).toHaveBeenCalledOnce();
  });
});
