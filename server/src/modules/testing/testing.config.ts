/**
 * Testing Portal configuration — loaded from the JSON file at TESTING_PORTAL_CONFIGURATION_FILE.
 *
 * NO personal data lives in code. The allowlist, the Testing Admins, and the provisioning roster
 * all come from this git-ignored file (see testing-portal.example.json for the schema). It is
 * loaded once at boot and FAIL-SAFE: an unset var, a missing/unreadable file, or an invalid shape
 * all disable the portal (returns DISABLED) rather than throwing. Production sets nothing => off.
 */
import { readFileSync } from "node:fs";
import { z } from "zod";
import type { RoleKey, ScopeType } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/** A provisioning-roster member, mapped from the config file's snake_case entries. */
export interface RosterMember {
  email: string;
  fullName: string;
  role: RoleKey; // RBAC grant
  scope: ScopeType; // DOMAIN (teacher) · TEAM (mentor) · SELF (mentee)
  memberRole?: string; // TeamMember.memberRole — omitted for the domain-scoped teacher
  primaryMentor?: boolean; // becomes team.mentorId
  roleLabel: string; // how the guided scripts refer to this actor (e.g. "the Primary Mentor")
}

const memberSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"]),
  scope: z.enum(["GLOBAL", "DOMAIN", "TEAM", "SELF"]),
  member_role: z.string().optional(),
  primary_mentor: z.boolean().optional(),
  role_label: z.string().min(1),
});

const fileSchema = z.object({
  enabled: z.boolean().default(false),
  admin_emails: z.array(z.string().email()).default([]),
  allowlist: z.array(z.string().email()).default([]),
  roster: z.array(memberSchema).default([]),
});

export interface TestingPortalConfig {
  enabled: boolean;
  adminEmails: Set<string>; // lower-cased
  allowlist: Set<string>; // lower-cased; always a superset of adminEmails
  roster: RosterMember[];
}

const DISABLED: TestingPortalConfig = {
  enabled: false,
  adminEmails: new Set(),
  allowlist: new Set(),
  roster: [],
};

let cached: TestingPortalConfig | undefined;

/** Load + cache the Testing Portal config. Fail-safe: any problem => the portal is disabled. */
export function testingPortalConfig(): TestingPortalConfig {
  if (cached !== undefined) return cached;
  const path = env.TESTING_PORTAL_CONFIGURATION_FILE;
  if (!path) {
    cached = DISABLED;
    return cached;
  }
  try {
    const raw = fileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    const lower = (e: string) => e.toLowerCase();
    const adminEmails = new Set(raw.admin_emails.map(lower));
    const allowlist = new Set([...raw.allowlist, ...raw.admin_emails].map(lower));
    const roster: RosterMember[] = raw.roster.map((m) => ({
      email: m.email,
      fullName: m.full_name,
      role: m.role as RoleKey,
      scope: m.scope as ScopeType,
      memberRole: m.member_role,
      primaryMentor: m.primary_mentor,
      roleLabel: m.role_label,
    }));
    cached = { enabled: raw.enabled, adminEmails, allowlist, roster };
    if (cached.enabled) {
      logger.info({ testers: allowlist.size, roster: roster.length }, "[testing] portal ENABLED from config file");
    }
  } catch (err) {
    logger.warn({ err }, "[testing] config file missing/invalid — Testing Portal disabled");
    cached = DISABLED;
  }
  return cached;
}

export const testingPortalEnabled = (): boolean => testingPortalConfig().enabled;

/** TEST-ONLY: override the cached config (bypasses the file). Pass null to clear the cache. */
export function __setTestingPortalConfigForTest(cfg: TestingPortalConfig | null): void {
  cached = cfg ?? undefined;
}
