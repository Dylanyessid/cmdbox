import { useRef } from "react";
import { EllipsisIcon, FolderIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collection } from "@/domain/models";
import { CollectionNameInput } from "./CollectionNameInput";

interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

export function CollectionItem({
  collection,
  isSelected,
  isRenaming,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: CollectionItemProps) {
  // When "Rename" is picked, the menu must not move focus back to its trigger:
  // that would blur (and close) the rename input it just opened.
  const isOpeningRename = useRef(false);

  if (isRenaming) {
    return (
      <li className="px-1">
        <CollectionNameInput
          initialValue={collection.name}
          onSubmit={onRename}
          onCancel={onCancelRename}
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onStartRename}
        aria-current={isSelected || undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isSelected && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        )}
      >
        <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{collection.name}</span>
      </button>

      {/* Non-modal so opening the delete dialog from it doesn't leave the page unclickable. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Actions for ${collection.name}`}
            className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={(e) => {
            if (isOpeningRename.current) e.preventDefault();
            isOpeningRename.current = false;
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              isOpeningRename.current = true;
              onStartRename();
            }}
          >
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
