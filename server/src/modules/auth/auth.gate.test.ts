import { describe, it, expect } from "vitest";
import { hostedDomainAllowed } from "./auth.gate.js";

const DOMAIN = "rishihood.edu.in";

describe("hostedDomainAllowed — Google login gate", () => {
  it("accepts the hosted-domain claim", () => {
    expect(hostedDomainAllowed("taj@rishihood.edu.in", "rishihood.edu.in", DOMAIN)).toBe(true);
  });
  it("accepts when the email is on the domain (no hd claim)", () => {
    expect(hostedDomainAllowed("mentor@rishihood.edu.in", undefined, DOMAIN)).toBe(true);
  });
  it("rejects other domains", () => {
    expect(hostedDomainAllowed("random@gmail.com", undefined, DOMAIN)).toBe(false);
    expect(hostedDomainAllowed("random@gmail.com", "gmail.com", DOMAIN)).toBe(false);
  });
  it("allows any domain when none is configured", () => {
    expect(hostedDomainAllowed("anyone@anywhere.com", undefined, "")).toBe(true);
  });
});
