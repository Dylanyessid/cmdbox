/**
 * A `{{name}}` placeholder, with optional spaces inside the braces. Names start with a letter
 * or `_` and continue with letters, digits, `_` or `-`, so Go templates used by docker and
 * kubectl (`{{.Names}}`) are not mistaken for variables.
 *
 * Only use it with `matchAll` and `replace`: as a global regex, `test` and `exec` would keep
 * state between calls.
 */
const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}/g;

/** The variable names used in a template, without duplicates, in order of first appearance. */
export function extractVariables(template: string): string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    names.add(match[1]);
  }
  return [...names];
}

/**
 * Replaces each variable that has a value. Variables without one are left as they are, so the
 * caller can tell which ones are still missing. Values are inserted literally and only once:
 * they are never interpreted as patterns or interpolated again.
 */
export function interpolate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(VARIABLE_PATTERN, (placeholder, name: string) =>
    Object.hasOwn(values, name) ? values[name] : placeholder,
  );
}


/** The template's variables that have no value or an empty one. */
export function findMissingVariables(
  template: string,
  values: Readonly<Record<string, string>>,
): string[] {

  return extractVariables(template).filter(
    (name) => !Object.hasOwn(values, name) || values[name] === "",
  );
 
}

