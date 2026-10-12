import { TerminalIcon } from "lucide-react";
import type { Command } from "@/domain/models";
import { sidebarRowClass } from "./ActionsMenu";

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onOpen: () => void;
}

export function CommandItem({ command, isSelected, onOpen }: CommandItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-current={isSelected || undefined}
        className={sidebarRowClass(isSelected)}
      >
        <TerminalIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{command.name}</span>
      </button>
    </li>
  );
}
