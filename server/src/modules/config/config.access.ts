/**
 * Pure access rules for drive configuration — no I/O, fully unit-tested.
 *
 * Every config entity (phase, gate, cycle, escalation, rubric) carries a `domainId`:
 *   - `null`  → applies to ALL domains (a global setting),
 *   - a string → applies to that one domain only.
 *
 * Authorization:
 *   - A GLOBAL role (Admin/LCC) may write any config, global or domain-scoped.
 *   - A DOMAIN role (Teacher) may write only config for a domain they own, and may
 *     NOT create/edit all-domain (global) config.
 */
export interface ConfigScope {
  global: boolean;
  domainIds: string[];
}

/** May this scope create/edit a config entity targeting `domainId` (null = all domains)? */
export function canWriteConfigScope(scope: ConfigScope, domainId: string | null): boolean {
  if (scope.global) return true;
  if (domainId === null) return false; // only global roles touch all-domain config
  return scope.domainIds.includes(domainId);
}

/**
 * The Prisma `where` filter for reading config in scope: global roles see everything;
 * others see all-domain config plus config for the domains they own.
 */
export function configReadWhere(scope: ConfigScope): Record<string, unknown> {
  if (scope.global) return {};
  const or: Record<string, unknown>[] = [{ domainId: null }];
  if (scope.domainIds.length) or.push({ domainId: { in: scope.domainIds } });
  return { OR: or };
}
