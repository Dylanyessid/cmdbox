import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Collection, Command } from "@/domain/models";
import type { CollectionsState } from "@/hooks/useCollections";
import type { EditorTarget } from "@/state/editorTarget";
import { CollectionItem } from "./CollectionItem";
import { CollectionNameInput } from "./CollectionNameInput";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";

interface CollectionsSidebarProps {
  collections: CollectionsState;
  commands: Command[];
  editorTarget: EditorTarget;
  /** Opens a command (or a new one) in the editor. */
  onOpen: (target: EditorTarget) => void;
  /** Deletes a collection; the parent also refreshes the commands removed with it. */
  onDeleteCollection: (id: string) => Promise<void>;
}

export function CollectionsSidebar({
  collections,
  commands,
  editorTarget,
  onOpen,
  onDeleteCollection,
}: CollectionsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [toDelete, setToDelete] = useState<Collection | null>(null);

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

  async function handleDelete(collection: Collection) {
    setToDelete(null);
    await onDeleteCollection(collection.id);
  }

  function handleNewCommand(collectionId: string) {
    expand(collectionId);
    onOpen({ mode: "create", collectionId });
  }

  const isEmpty = !collections.isLoading && collections.items.length === 0 && !isCreating;

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
              onDelete={() => setToDelete(collection)}
              onNewCommand={() => handleNewCommand(collection.id)}
              onOpenCommand={(command) => onOpen({ mode: "edit", commandId: command.id })}
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

      <DeleteCollectionDialog
        collection={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </aside>
  );
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
