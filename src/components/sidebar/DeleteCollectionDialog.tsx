import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Collection } from "@/domain/models";
import { commandRepository } from "@/repositories";

interface DeleteCollectionDialogProps {
  /** The collection to delete; the dialog is open while it is set. */
  collection: Collection | null;
  onConfirm: (collection: Collection) => void;
  onCancel: () => void;
}

export function DeleteCollectionDialog({
  collection,
  onConfirm,
  onCancel,
}: DeleteCollectionDialogProps) {
  // Keep showing the last collection while the closing animation runs.
  const [shown, setShown] = useState(collection);
  if (collection && collection !== shown) setShown(collection);

  const [commandCount, setCommandCount] = useState<number | null>(null);

  useEffect(() => {
    if (!collection) return;
    let isCurrent = true;
    setCommandCount(null);
    commandRepository
      .listByCollection(collection.id)
      .then((commands) => isCurrent && setCommandCount(commands.length))
      .catch(console.error);
    return () => {
      isCurrent = false;
    };
  }, [collection]);

  return (
    <AlertDialog open={collection !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{shown?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {describeCommands(commandCount)} This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => collection && onConfirm(collection)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function describeCommands(count: number | null) {
  if (count === null) return "All of its commands will also be deleted.";
  if (count === 0) return "The collection is empty.";
  if (count === 1) return "Its command will also be deleted.";
  return `Its ${count} commands will also be deleted.`;
}
