import { useCallback, useEffect, useState } from "react";
import type { Command } from "@/domain/models";
import { withErrorToast } from "@/lib/withErrorToast";
import { commandRepository, type CommandInput } from "@/repositories";

export function useCommands() {
  const [items, setItems] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // All commands are kept in memory: the sidebar groups them and search (RF-18) will filter them.
  const reload = useCallback(async () => {
    setItems(await commandRepository.list());
  }, []);

  useEffect(() => {
    withErrorToast("Couldn't load commands", reload).finally(() => setIsLoading(false));
  }, [reload]);

  const create = (input: CommandInput) =>
    withErrorToast("Couldn't create the command", async () => {
      const command = await commandRepository.create(input);
      await reload();
      return command;
    });

  const update = (id: string, input: CommandInput) =>
    withErrorToast("Couldn't save the command", async () => {
      await commandRepository.update(id, input);
      await reload();
      return true;
    });

  return { items, isLoading, reload, create, update };
}

export type CommandsState = ReturnType<typeof useCommands>;
