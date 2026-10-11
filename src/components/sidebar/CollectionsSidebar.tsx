import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/domain/models";
import { useCollections } from "@/hooks/useCollections";
import { CollectionItem } from "./CollectionItem";
import { CollectionNameInput } from "./CollectionNameInput";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";

interface CollectionsSidebarProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CollectionsSidebar({ selectedId, onSelect }: CollectionsSidebarProps) {
  const { collections, isLoading, create, rename, remove } = useCollections();
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Collection | null>(null);

  async function handleCreate(name: string) {
    setIsCreating(false);
    const collection = await create(name);
    if (collection) onSelect(collection.id);
  }

  async function handleRename(id: string, name: string) {
    setRenamingId(null);
    await rename(id, name);
  }

  async function handleDelete(collection: Collection) {
    setToDelete(null);
    const deleted = await remove(collection.id);
    if (deleted && collection.id === selectedId) onSelect(null);
  }

  const isEmpty = !isLoading && collections.length === 0 && !isCreating;

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
          {collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              isSelected={collection.id === selectedId}
              isRenaming={collection.id === renamingId}
              onSelect={() => onSelect(collection.id)}
              onStartRename={() => setRenamingId(collection.id)}
              onRename={(name) => handleRename(collection.id, name)}
              onCancelRename={() => setRenamingId(null)}
              onDelete={() => setToDelete(collection)}
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
