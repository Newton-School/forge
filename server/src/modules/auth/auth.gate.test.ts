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
  it("accepts a subdomain — by hd claim or email (e.g. nst.rishihood.edu.in)", () => {
    expect(hostedDomainAllowed("lcc@nst.rishihood.edu.in", "nst.rishihood.edu.in", DOMAIN)).toBe(true);
    expect(hostedDomainAllowed("student@nst.rishihood.edu.in", undefined, DOMAIN)).toBe(true);
    // hd hint of the base domain, account actually on a subdomain (the real-world case)
    expect(hostedDomainAllowed("lcc@nst.rishihood.edu.in", "rishihood.edu.in", DOMAIN)).toBe(true);
  });
  it("rejects other domains and look-alikes", () => {
    expect(hostedDomainAllowed("random@gmail.com", undefined, DOMAIN)).toBe(false);
    expect(hostedDomainAllowed("random@gmail.com", "gmail.com", DOMAIN)).toBe(false);
    // not a true subdomain — no dot boundary before the base
    expect(hostedDomainAllowed("attacker@evilrishihood.edu.in", undefined, DOMAIN)).toBe(false);
    expect(hostedDomainAllowed("attacker@rishihood.edu.in.evil.com", undefined, DOMAIN)).toBe(false);
  });
  it("allows any domain when none is configured", () => {
    expect(hostedDomainAllowed("anyone@anywhere.com", undefined, "")).toBe(true);
  });
});
