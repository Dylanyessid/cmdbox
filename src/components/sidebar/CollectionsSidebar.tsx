import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { Collection, Command } from "@/domain/models";
import type { CollectionsState } from "@/hooks/useCollections";
import type { EditorTarget } from "@/state/editorTarget";
import { CollectionItem } from "./CollectionItem";
import { CollectionNameInput } from "./CollectionNameInput";

interface CollectionsSidebarProps {
  collections: CollectionsState;
  commands: Command[];
  editorTarget: EditorTarget;
  /** Opens a command (or a new one) in the editor. */
  onOpen: (target: EditorTarget) => void;
  /** Deletes a collection; the parent also refreshes the commands removed with it. */
  onDeleteCollection: (id: string) => Promise<void>;
  onDuplicateCommand: (command: Command) => Promise<void>;
  onDeleteCommand: (command: Command) => Promise<void>;
}

export function CollectionsSidebar({
  collections,
  commands,
  editorTarget,
  onOpen,
  onDeleteCollection,
  onDuplicateCommand,
  onDeleteCommand,
}: CollectionsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [commandToDelete, setCommandToDelete] = useState<Command | null>(null);

  const commandsByCollection = groupByCollection(commands);

  function expand(id: string) {
    setExpandedIds((ids) => new Set(ids).add(id));
  }

  function toggle(id: string) {
    setExpandedIds((ids) => {
      const next = new Set(ids);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function handleCreate(name: string) {
    setIsCreating(false);
    const collection = await collections.create(name);
    if (collection) expand(collection.id);
  }

  async function handleRename(id: string, name: string) {
    setRenamingId(null);
    await collections.rename(id, name);
  }

  async function handleDeleteCollection(collection: Collection) {
    setCollectionToDelete(null);
    await onDeleteCollection(collection.id);
  }

  async function handleDeleteCommand(command: Command) {
    setCommandToDelete(null);
    await onDeleteCommand(command);
  }

  function handleNewCommand(collectionId: string) {
    expand(collectionId);
    onOpen({ mode: "create", collectionId });
  }

  const isEmpty = !collections.isLoading && collections.items.length === 0 && !isCreating;
  const commandsToDelete = collectionToDelete
    ? (commandsByCollection.get(collectionToDelete.id)?.length ?? 0)
    : 0;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <header className="flex items-center justify-between px-3 py-2">
        <h1 className="font-heading text-base font-semibold">cmdbox</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New collection"
          title="New collection"
          onClick={() => setIsCreating(true)}
        >
          <PlusIcon />
        </Button>
      </header>

      <nav aria-label="Collections" className="flex-1 overflow-y-auto px-2 pb-2">
        <ul className="flex flex-col gap-0.5">
          {isCreating && (
            <li className="px-1">
              <CollectionNameInput
                placeholder="Collection name"
                onSubmit={handleCreate}
                onCancel={() => setIsCreating(false)}
              />
            </li>
          )}
          {collections.items.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              commands={commandsByCollection.get(collection.id) ?? []}
              editorTarget={editorTarget}
              isExpanded={expandedIds.has(collection.id)}
              isRenaming={collection.id === renamingId}
              onToggle={() => toggle(collection.id)}
              onStartRename={() => setRenamingId(collection.id)}
              onRename={(name) => handleRename(collection.id, name)}
              onCancelRename={() => setRenamingId(null)}
              onDelete={() => setCollectionToDelete(collection)}
              onNewCommand={() => handleNewCommand(collection.id)}
              onOpenCommand={(command) => onOpen({ mode: "edit", commandId: command.id })}
              onDuplicateCommand={onDuplicateCommand}
              onDeleteCommand={setCommandToDelete}
            />
          ))}
        </ul>

        {isEmpty && (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center text-sm text-muted-foreground">
            <p>No collections yet</p>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
              <PlusIcon />
              New collection
            </Button>
          </div>
        )}
      </nav>

      <ConfirmDialog
        open={collectionToDelete !== null}
        title={`Delete “${collectionToDelete?.name}”?`}
        description={`${describeCommands(commandsToDelete)} This can’t be undone.`}
        confirmLabel="Delete"
        onConfirm={() => collectionToDelete && handleDeleteCollection(collectionToDelete)}
        onCancel={() => setCollectionToDelete(null)}
      />
      <ConfirmDialog
        open={commandToDelete !== null}
        title={`Delete “${commandToDelete?.name}”?`}
        description="This can’t be undone."
        confirmLabel="Delete"
        onConfirm={() => commandToDelete && handleDeleteCommand(commandToDelete)}
        onCancel={() => setCommandToDelete(null)}
      />
    </aside>
  );
}

function describeCommands(count: number) {
  if (count === 0) return "The collection is empty.";
  if (count === 1) return "Its command will also be deleted.";
  return `Its ${count} commands will also be deleted.`;
}

function groupByCollection(commands: Command[]) {
  const groups = new Map<string, Command[]>();
  for (const command of commands) {
    const group = groups.get(command.collectionId);
    if (group) group.push(command);
    else groups.set(command.collectionId, [command]);
  }
  return groups;
}
