import { describe, it, expect } from "vitest";
import { buildOnboardingEmail } from "./onboarding.js";

const base = { fullName: "Aryan Sharma", role: "Mentor", domain: "AI", team: "Team Alpha", portalUrl: "https://forge.test" };

describe("buildOnboardingEmail", () => {
  it("renders the production variant (no TEST banner, prod subject)", () => {
    const m = buildOnboardingEmail(base);
    expect(m.subject).toBe("Welcome to the Profile Building Drive Portal");
    expect(m.html).not.toContain("TEST EMAIL");
    expect(m.html).toContain("Aryan Sharma");
    expect(m.html).toContain("Mentor");
    expect(m.html).toContain("https://forge.test");
    expect(m.from).toContain("Learner Career Council (LCC)");
    expect(m.text).toContain("Hi Aryan Sharma,");
  });

  it("renders the [TEST] variant with banner + subject", () => {
    const m = buildOnboardingEmail({ ...base, test: true });
    expect(m.subject).toBe("[TEST] Profile Building Drive Portal - User Onboarding");
    expect(m.html).toContain("TEST EMAIL");
    expect(m.text).toContain("[TEST EMAIL");
  });

  it("includes the tracking pixel only when a trackUrl is given", () => {
    expect(buildOnboardingEmail(base).html).not.toContain("/api/email/track/");
    const withPixel = buildOnboardingEmail({ ...base, trackUrl: "https://forge.test/api/email/track/abc.png" });
    expect(withPixel.html).toContain('src="https://forge.test/api/email/track/abc.png"');
  });

  it("escapes HTML in user-supplied fields", () => {
    const m = buildOnboardingEmail({ ...base, fullName: "<script>x</script>" });
    expect(m.html).not.toContain("<script>x");
    expect(m.html).toContain("&lt;script&gt;");
  });

  it("falls back to placeholders for empty fields", () => {
    const m = buildOnboardingEmail({ fullName: "", role: "", domain: "", team: "", portalUrl: "https://forge.test" });
    expect(m.html).toContain("Hi there,");
  });
});
