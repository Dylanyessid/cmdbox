import { useState } from "react";
import { CommandEditor, type CommandDraft } from "@/components/editor/CommandEditor";
import { CollectionsSidebar } from "@/components/sidebar/CollectionsSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useCollections } from "@/hooks/useCollections";
import { useCommands } from "@/hooks/useCommands";
import { withErrorToast } from "@/lib/withErrorToast";
import type { EditorTarget } from "@/state/editorTarget";

function App() {
  const collections = useCollections();
  const commands = useCommands();
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);

  async function deleteCollection(id: string) {
    const deleted = await collections.remove(id);
    // Its commands were deleted by ON DELETE CASCADE; reload them too.
    if (deleted) await withErrorToast("Couldn't reload commands", commands.reload);
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
      if (created) setEditorTarget({ mode: "edit", commandId: created.id });
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <CollectionsSidebar
        collections={collections}
        commands={commands.items}
        editorTarget={editorTarget}
        onOpen={setEditorTarget}
        onDeleteCollection={deleteCollection}
      />

      <main className="min-w-0 flex-1">
        {isEditorOpen ? (
          <CommandEditor
            key={command?.id ?? `new:${collection.id}`}
            command={command}
            collectionName={collection.name}
            onSave={handleSave}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Select a command, or create one from a collection’s menu.
          </div>
        )}
      </main>

      <Toaster />
    </div>
  );
}

export default App;
