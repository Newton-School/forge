import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Google's verifier — we test our handling of its result, not Google's crypto.
const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

import { verifyGoogleIdToken } from "./auth.service.js";

const payload = (over: Record<string, unknown> = {}) => ({
  getPayload: () => ({ sub: "g-123", email: "u@rishihood.edu.in", email_verified: true, name: "U", hd: "rishihood.edu.in", ...over }),
});

describe("verifyGoogleIdToken", () => {
  beforeEach(() => verifyIdToken.mockReset());

  it("returns a profile from a cryptographically verified token", async () => {
    verifyIdToken.mockResolvedValue(payload());
    await expect(verifyGoogleIdToken("tok")).resolves.toMatchObject({
      sub: "g-123", email: "u@rishihood.edu.in", hd: "rishihood.edu.in", name: "U",
    });
    // audience must be checked against our client id (the verifier enforces aud/iss/exp/signature)
    expect(verifyIdToken).toHaveBeenCalledWith(expect.objectContaining({ idToken: "tok" }));
  });

  it("rejects a token whose email is not verified", async () => {
    verifyIdToken.mockResolvedValue(payload({ email_verified: false }));
    await expect(verifyGoogleIdToken("tok")).rejects.toHaveProperty("status", 403);
  });

  it("rejects a token with no email claim", async () => {
    verifyIdToken.mockResolvedValue({ getPayload: () => ({ sub: "g-1" }) });
    await expect(verifyGoogleIdToken("tok")).rejects.toHaveProperty("status", 403);
  });
});
