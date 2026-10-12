import { CopyIcon, TerminalIcon, Trash2Icon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Command } from "@/domain/models";
import { ActionsMenu, sidebarRowClass } from "./ActionsMenu";

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CommandItem({ command, isSelected, onOpen, onDuplicate, onDelete }: CommandItemProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-current={isSelected || undefined}
        className={sidebarRowClass(isSelected)}
      >
        <TerminalIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{command.name}</span>
      </button>

      <ActionsMenu label={`Actions for ${command.name}`}>
        <DropdownMenuItem onSelect={onDuplicate}>
          <CopyIcon />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </ActionsMenu>
    </li>
  );
}
