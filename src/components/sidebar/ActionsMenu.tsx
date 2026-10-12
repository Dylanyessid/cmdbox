import type { ComponentProps, ReactNode } from "react";
import { EllipsisIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Classes for a clickable sidebar row; leaves room on the right for its ActionsMenu. */
export function sidebarRowClass(isSelected = false) {
  return cn(
    "flex w-full items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    isSelected && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
  );
}

interface ActionsMenuProps {
  label: string;
  children: ReactNode;
  onCloseAutoFocus?: ComponentProps<typeof DropdownMenuContent>["onCloseAutoFocus"];
}

/** The "⋯" menu shown on hover at the right of a sidebar row (the row must have `group relative`). */
export function ActionsMenu({ label, children, onCloseAutoFocus }: ActionsMenuProps) {
  return (
    // Non-modal so opening a dialog from it doesn't leave the page unclickable.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={onCloseAutoFocus}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
