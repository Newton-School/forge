/**
 * Testing Portal access is restricted to a fixed email allowlist (NOT the RBAC roles) —
 * a small, explicit set of accounts validate the app before production. One Testing Admin
 * has full visibility into reported issues.
 */
export const TESTING_ADMIN_EMAIL = "shaik.tajuddin2024@nst.rishihood.edu.in";

const EMAILS = [
  "shaik.tajuddin2024@nst.rishihood.edu.in",
  "learnercareercouncil@nst.rishihood.edu.in",
  "abhinav.choudhary2024@nst.rishihood.edu.in",
  "aniket.pathak2024@nst.rishihood.edu.in",
  "anwesha.adhikari2024@nst.rishihood.edu.in",
  "khushi.2024@nst.rishihood.edu.in",
  "nikith.s2024@nst.rishihood.edu.in",
];
export const TESTER_EMAILS = new Set(EMAILS.map((e) => e.toLowerCase()));

export const isTester = (email?: string | null): boolean => !!email && TESTER_EMAILS.has(email.toLowerCase());
export const isTestingAdmin = (email?: string | null): boolean => (email ?? "").toLowerCase() === TESTING_ADMIN_EMAIL;
