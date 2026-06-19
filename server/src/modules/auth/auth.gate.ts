/**
 * Pure login-gate predicate (no env/db imports → unit-testable in isolation).
 *
 * Accepts the configured base domain AND any subdomain of it — so `rishihood.edu.in` admits
 * both `@rishihood.edu.in` and `@nst.rishihood.edu.in`. Matched against the Google `hd` claim
 * (preferred) or the email's domain. The leading dot in the subdomain check prevents
 * look-alikes like `evilrishihood.edu.in` from slipping through.
 */
export function hostedDomainAllowed(
  email: string,
  hd: string | undefined,
  allowed: string,
): boolean {
  if (!allowed) return true;
  const base = allowed.toLowerCase();
  const matches = (d: string | undefined): boolean => {
    if (!d) return false;
    const v = d.toLowerCase();
    return v === base || v.endsWith(`.${base}`);
  };
  return matches(hd) || matches(email.toLowerCase().split("@")[1]);
}
