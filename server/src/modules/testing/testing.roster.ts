/**
 * The tester roster provisioned per domain, sourced from the Testing Portal config file
 * (testing.config.ts). NO personal data in code — an unset/disabled config yields an empty
 * roster, so provisioning is a safe no-op. Each member's `roleLabel` is how the guided test
 * scripts refer to that actor (e.g. "the Primary Mentor"), so the scripts stay PII-free while
 * the concrete person comes from the config at runtime.
 */
import { testingPortalConfig, type RosterMember } from "./testing.config.js";

export type { RosterMember };

/** The domain testers (Admin + LCC are seeded globally and are not part of this roster). Read
 *  live from the config each call so tests can inject a config and prod stays empty when off. */
export const testerRoster = (): RosterMember[] => testingPortalConfig().roster;

/** Stable per-domain team id + name (idempotent across repeated provisioning). */
export const teamIdFor = (domainKey: string): string => `t-test-${domainKey.toLowerCase()}`;
export const teamNameFor = (domainKey: string): string => `${domainKey} Testing Team`;

export const ALL_DOMAIN_KEYS = ["AI", "ML", "DVA", "SDSE"] as const;
/** Every email this roster can provision — the closed set teardown is allowed to delete. */
export const rosterEmails = (): string[] => testerRoster().map((m) => m.email);
/** Every possible test-team id (one per domain) — used to find what to tear down. */
export const ALL_TEST_TEAM_IDS = ALL_DOMAIN_KEYS.map(teamIdFor);
