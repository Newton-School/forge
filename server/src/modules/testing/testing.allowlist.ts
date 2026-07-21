/**
 * Testing Portal access is restricted to the email allowlist declared in the config file
 * (see testing.config.ts / testing-portal.example.json) — NOT the RBAC roles. NO personal
 * data lives in code: an unset/disabled config yields an empty allowlist, so the portal is
 * effectively closed. One or more Testing Admins have full visibility into reported issues.
 */
import { testingPortalConfig } from "./testing.config.js";

export const isTester = (email?: string | null): boolean =>
  !!email && testingPortalConfig().allowlist.has(email.toLowerCase());

export const isTestingAdmin = (email?: string | null): boolean =>
  !!email && testingPortalConfig().adminEmails.has(email.toLowerCase());

/** Recipient list for issue-report notifications — the configured Testing Admins (may be empty). */
export const testingAdminEmails = (): string[] => [...testingPortalConfig().adminEmails];
