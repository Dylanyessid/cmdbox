import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CommandEditor, type CommandDraft } from "@/components/editor/CommandEditor";
import { CollectionsSidebar } from "@/components/sidebar/CollectionsSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useCollections } from "@/hooks/useCollections";
import { useCommands } from "@/hooks/useCommands";
import { withErrorToast } from "@/lib/withErrorToast";
import type { Command } from "@/domain/models";
import { isSameTarget, type EditorTarget } from "@/state/editorTarget";

function App() {
  const collections = useCollections();
  const commands = useCommands();
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);
  const [isDirty, setIsDirty] = useState(false);
  // Where the user wanted to go while the editor had unsaved changes; null if nowhere.
  const [pendingTarget, setPendingTarget] = useState<{ target: EditorTarget } | null>(null);

  /** Opens something in the editor, asking first if that would discard unsaved changes. */
  function requestOpen(target: EditorTarget) {
    if (isSameTarget(target, editorTarget)) return;
    if (isDirty) setPendingTarget({ target });
    else setEditorTarget(target);
  }

  function discardChangesAndOpen() {
    if (!pendingTarget) return;
    setIsDirty(false);
    setEditorTarget(pendingTarget.target);
    setPendingTarget(null);
  }

  async function deleteCollection(id: string) {
    const deleted = await collections.remove(id);
    // Its commands were deleted by ON DELETE CASCADE; reload them too.
    if (deleted) await withErrorToast("Couldn't reload commands", commands.reload);
  }

  async function duplicateCommand(original: Command) {
    const copy = await commands.duplicate(original);
    if (copy) requestOpen({ mode: "edit", commandId: copy.id });
  }

  async function deleteCommand(command: Command) {
    await commands.remove(command.id);
  }

  // Resolved on every render, so a deleted command or collection simply stops being shown.
  const command =
    editorTarget?.mode === "edit"
      ? (commands.items.find((c) => c.id === editorTarget.commandId) ?? null)
      : null;
  const collectionId =
    editorTarget?.mode === "create" ? editorTarget.collectionId : command?.collectionId;
  const collection = collections.items.find((c) => c.id === collectionId);
  const isEditorOpen =
    collection !== undefined && (command !== null || editorTarget?.mode === "create");

  async function handleSave(draft: CommandDraft) {
    if (command) {
      await commands.update(command.id, {
        ...draft,
        collectionId: command.collectionId,
        variables: command.variables,
      });
    } else if (collection) {
      const created = await commands.create({ ...draft, collectionId: collection.id, variables: [] });
      if (created) {
        setIsDirty(false);
        setEditorTarget({ mode: "edit", commandId: created.id });
      }
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <CollectionsSidebar
        collections={collections}
        commands={commands.items}
        editorTarget={editorTarget}
        onOpen={requestOpen}
        onDeleteCollection={deleteCollection}
        onDuplicateCommand={duplicateCommand}
        onDeleteCommand={deleteCommand}
      />

      <main className="min-w-0 flex-1">
        {isEditorOpen ? (
          <CommandEditor
            key={command?.id ?? `new:${collection.id}`}
            command={command}
            collectionName={collection.name}
            onSave={handleSave}
            onDirtyChange={setIsDirty}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Select a command, or create one from a collection’s menu.
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pendingTarget !== null}
        title="Discard unsaved changes?"
        description="Your changes to this command will be lost."
        confirmLabel="Discard"
        onConfirm={discardChangesAndOpen}
        onCancel={() => setPendingTarget(null)}
      />
      <Toaster />
    </div>
  );
}

export default App;
