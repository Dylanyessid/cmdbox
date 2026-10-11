export const MAX_TAG_LENGTH = 30;

/** Splits raw input on commas into clean tags: trimmed, non-empty and at most MAX_TAG_LENGTH long. */
export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim().slice(0, MAX_TAG_LENGTH).trim())
    .filter((tag) => tag !== "");
}

/** Appends tags to a list, skipping those already present (compared case-insensitively). */
export function addTags(current: string[], toAdd: string[]): string[] {
  const result = [...current];
  for (const tag of toAdd) {
    if (!result.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      result.push(tag);
    }
  }
  return result;
}
