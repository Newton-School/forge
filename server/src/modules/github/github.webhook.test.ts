import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { normalizeEvent, verifyGithubSignature } from "./github.webhook.js";

const SECRET = "whsec_test";
function sign(body: string, secret = SECRET) {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyGithubSignature", () => {
  const body = JSON.stringify({ hello: "world" });

  it("accepts a correct signature", () => {
    expect(verifyGithubSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body, wrong secret, or missing header", () => {
    expect(verifyGithubSignature(body + "x", sign(body), SECRET)).toBe(false);
    expect(verifyGithubSignature(body, sign(body, "other"), SECRET)).toBe(false);
    expect(verifyGithubSignature(body, undefined, SECRET)).toBe(false);
    expect(verifyGithubSignature(body, "sha256=deadbeef", SECRET)).toBe(false);
  });
});

describe("normalizeEvent", () => {
  it("maps a push to one COMMIT row per commit", () => {
    const rows = normalizeEvent("push", {
      repository: { full_name: "org/repo" },
      commits: [
        { id: "abc", message: "feat: x\n\nbody", url: "u1", timestamp: "2026-06-14T10:00:00Z", author: { username: "alice" } },
        { id: "def", message: "fix: y", url: "u2", timestamp: "2026-06-14T11:00:00Z", author: { name: "Bob" } },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: "COMMIT", externalId: "commit:abc", title: "feat: x", githubLogin: "alice", repo: "org/repo" });
    expect(rows[1]).toMatchObject({ githubLogin: "Bob" });
  });

  it("maps a merged pull_request", () => {
    const [row] = normalizeEvent("pull_request", {
      action: "closed",
      repository: { full_name: "org/repo" },
      pull_request: { number: 7, title: "Add feature", merged: true, html_url: "url", updated_at: "2026-06-14T12:00:00Z", user: { login: "alice" } },
    });
    expect(row).toMatchObject({ type: "PR", externalId: "pr:org/repo:7", state: "merged", title: "Add feature" });
  });

  it("maps issues and reviews, and ignores unknown events", () => {
    expect(normalizeEvent("issues", { repository: { full_name: "o/r" }, issue: { number: 3, title: "Bug", state: "open" } })[0])
      .toMatchObject({ type: "ISSUE", externalId: "issue:o/r:3" });
    expect(normalizeEvent("pull_request_review", { review: { id: 99, state: "approved", submitted_at: "2026-06-14T13:00:00Z", user: { login: "bob" } }, pull_request: { title: "PR" } })[0])
      .toMatchObject({ type: "REVIEW", externalId: "review:99", state: "approved" });
    expect(normalizeEvent("watch", {})).toEqual([]);
  });
});
