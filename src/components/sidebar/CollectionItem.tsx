import { useRef } from "react";
import { ChevronRightIcon, PencilIcon, PlusIcon, SquarePenIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { Collection, Command } from "@/domain/models";
import type { EditorTarget } from "@/state/editorTarget";
import { ActionsMenu, sidebarRowClass } from "./ActionsMenu";
import { CollectionNameInput } from "./CollectionNameInput";
import { CommandItem } from "./CommandItem";

interface CollectionItemProps {
  collection: Collection;
  commands: Command[];
  editorTarget: EditorTarget;
  isExpanded: boolean;
  isRenaming: boolean;
  onToggle: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onNewCommand: () => void;
  onOpenCommand: (command: Command) => void;
  onDuplicateCommand: (command: Command) => void;
  onDeleteCommand: (command: Command) => void;
}

export function CollectionItem({
  collection,
  commands,
  editorTarget,
  isExpanded,
  isRenaming,
  onToggle,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
  onNewCommand,
  onOpenCommand,
  onDuplicateCommand,
  onDeleteCommand,
}: CollectionItemProps) {
  // When "Rename" is picked, the menu must not move focus back to its trigger:
  // that would blur (and close) the rename input it just opened.
  const isOpeningRename = useRef(false);
  const isDraftingCommand =
    editorTarget?.mode === "create" && editorTarget.collectionId === collection.id;

  return (
    <li>
      {isRenaming ? (
        <div className="px-1">
          <CollectionNameInput
            initialValue={collection.name}
            onSubmit={onRename}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <div className="group relative">
          <button
            type="button"
            onClick={onToggle}
            onKeyDown={(e) => e.key === "F2" && onStartRename()}
            aria-expanded={isExpanded}
            className={sidebarRowClass()}
          >
            <ChevronRightIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            <span className="truncate">{collection.name}</span>
          </button>

          <ActionsMenu
            label={`Actions for ${collection.name}`}
            onCloseAutoFocus={(e) => {
              if (isOpeningRename.current) e.preventDefault();
              isOpeningRename.current = false;
            }}
          >
            <DropdownMenuItem onSelect={onNewCommand}>
              <PlusIcon />
              New command
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
          </ActionsMenu>
        </div>
      )}

      {isExpanded && (
        <ul className="ml-4 flex flex-col gap-0.5 border-l pl-1">
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              command={command}
              isSelected={editorTarget?.mode === "edit" && editorTarget.commandId === command.id}
              onOpen={() => onOpenCommand(command)}
              onDuplicate={() => onDuplicateCommand(command)}
              onDelete={() => onDeleteCommand(command)}
            />
          ))}
          {isDraftingCommand && (
            <li className={cn(sidebarRowClass(true), "italic")}>
              <SquarePenIcon className="size-3.5 shrink-0 text-muted-foreground" />
              New command
            </li>
          )}
          {commands.length === 0 && !isDraftingCommand && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No commands</li>
          )}
        </ul>
      )}
    </li>
  );
}
