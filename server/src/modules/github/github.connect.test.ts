import { describe, it, expect } from "vitest";
import { encodeState, decodeState, type OAuthState } from "./github.oauth.js";
import { parseRepo } from "./github.hooks.js";

describe("OAuth state codec", () => {
  it("round-trips a username-only state", () => {
    const s: OAuthState = { n: "abc123" };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("round-trips a repo-bind state", () => {
    const s: OAuthState = { n: "n1", repo: "owner/repo", teamId: "t-1" };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("rejects malformed / missing state (CSRF safety)", () => {
    expect(decodeState(undefined)).toBeNull();
    expect(decodeState("not-base64-json")).toBeNull();
    // valid base64url JSON but without a nonce is not a usable state
    expect(decodeState(Buffer.from(JSON.stringify({ repo: "a/b" })).toString("base64url"))).toBeNull();
  });
});

describe("parseRepo", () => {
  it("accepts owner/repo", () => {
    expect(parseRepo("acme/widgets")).toEqual({ owner: "acme", repo: "widgets" });
  });

  it("accepts a full github.com URL (with .git / trailing slash)", () => {
    expect(parseRepo("https://github.com/acme/widgets")).toEqual({ owner: "acme", repo: "widgets" });
    expect(parseRepo("https://github.com/acme/widgets.git")).toEqual({ owner: "acme", repo: "widgets" });
    expect(parseRepo("  https://github.com/acme/widgets/  ")).toEqual({ owner: "acme", repo: "widgets" });
  });

  it("rejects junk", () => {
    expect(() => parseRepo("not a repo")).toThrow();
    expect(() => parseRepo("only-owner")).toThrow();
  });
});
