/** What the editor panel is working on: an existing command, a new one in a collection, or nothing. */
export type EditorTarget =
  | { mode: "edit"; commandId: string }
  | { mode: "create"; collectionId: string }
  | null;

export function isSameTarget(a: EditorTarget, b: EditorTarget): boolean {
  if (a === null || b === null) return a === b;
  if (a.mode === "edit" && b.mode === "edit") return a.commandId === b.commandId;
  if (a.mode === "create" && b.mode === "create") return a.collectionId === b.collectionId;
  return false;
}
