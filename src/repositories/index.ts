// The rest of the app imports repositories from here, never from ./sqlite,
// so the storage implementation can be swapped in this one place.
import { sqliteCollectionRepository } from "./sqlite/collectionRepository";
import { sqliteCommandRepository } from "./sqlite/commandRepository";
import type { CollectionRepository, CommandRepository } from "./types";

export const collectionRepository: CollectionRepository = sqliteCollectionRepository;
export const commandRepository: CommandRepository = sqliteCommandRepository;

export * from "./types";
