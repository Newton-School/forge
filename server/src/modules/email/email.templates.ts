/**
 * Pure merge-field rendering for email/announcement bodies — no I/O, unit-tested.
 * Placeholders look like `{{name}}` (whitespace tolerated). Unknown placeholders are
 * left intact so a missing variable is visible rather than silently blanked.
 */
const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

export type TemplateVars = Record<string, string | number | boolean | null | undefined>;

export function renderTemplate(template: string, vars: TemplateVars = {}): string {
  return template.replace(PLACEHOLDER, (whole, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? whole : String(v);
  });
}

/** Placeholders in the template that have no value supplied (for validation/preview). */
export function missingVars(template: string, vars: TemplateVars = {}): string[] {
  const missing = new Set<string>();
  for (const m of template.matchAll(PLACEHOLDER)) {
    const key = m[1]!;
    if (vars[key] === undefined || vars[key] === null) missing.add(key);
  }
  return [...missing];
}
