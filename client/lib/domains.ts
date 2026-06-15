import { DOMAINS } from "@/lib/api";

export const ALL_DOMAIN_KEYS = DOMAINS.map((d) => d.key); // ["AI","ML","SDSE"]

/** Parse the `?domain=AI,ML` search param into a list of domain keys. */
export function parseDomains(raw?: string | string[]): string[] {
  if (!raw) return [];
  const s = Array.isArray(raw) ? raw.join(",") : raw;
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/** A row is shown when nothing is selected (all) or its domain is in the selection. */
export function inDomains(key: string | undefined, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return !!key && selected.includes(key);
}

export function domainName(key: string): string {
  return DOMAINS.find((d) => d.key === key)?.name ?? key;
}
