import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Collection } from "@/domain/models";
import { collectionRepository } from "@/repositories";

/** Runs a repository action; on failure shows an error toast and returns undefined. */
async function withErrorToast<T>(message: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    console.error(error);
    toast.error(message);
    return undefined;
  }
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The database owns the order (alphabetical), so reload the list after every change.
  const reload = useCallback(async () => {
    setCollections(await collectionRepository.list());
  }, []);

  useEffect(() => {
    withErrorToast("Couldn't load collections", reload).finally(() => setIsLoading(false));
  }, [reload]);

  const create = (name: string) =>
    withErrorToast("Couldn't create the collection", async () => {
      const collection = await collectionRepository.create(name);
      await reload();
      return collection;
    });

  const rename = (id: string, name: string) =>
    withErrorToast("Couldn't rename the collection", async () => {
      await collectionRepository.rename(id, name);
      await reload();
      return true;
    });

  const remove = (id: string) =>
    withErrorToast("Couldn't delete the collection", async () => {
      await collectionRepository.delete(id);
      await reload();
      return true;
    });

  return { collections, isLoading, create, rename, remove };
}
