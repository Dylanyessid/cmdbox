/** What the editor panel is working on: an existing command, a new one in a collection, or nothing. */
export type EditorTarget =
  | { mode: "edit"; commandId: string }
  | { mode: "create"; collectionId: string }
  | null;
