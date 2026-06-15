/** Pure login-gate predicate (no env/db imports → unit-testable in isolation). */
export function hostedDomainAllowed(
  email: string,
  hd: string | undefined,
  allowed: string,
): boolean {
  if (!allowed) return true;
  return hd === allowed || email.toLowerCase().endsWith(`@${allowed.toLowerCase()}`);
}
