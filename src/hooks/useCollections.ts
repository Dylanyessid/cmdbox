import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@/domain/models";
import { withErrorToast } from "@/lib/withErrorToast";
import { collectionRepository } from "@/repositories";

export function useCollections() {
  const [items, setItems] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The database owns the order (alphabetical), so reload the list after every change.
  const reload = useCallback(async () => {
    setItems(await collectionRepository.list());
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

  return { items, isLoading, create, rename, remove };
}

export type CollectionsState = ReturnType<typeof useCollections>;
