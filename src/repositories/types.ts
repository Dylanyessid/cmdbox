import type { Collection, Command } from "../domain/models";

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  create(name: string): Promise<Collection>;
  rename(id: string, name: string): Promise<void>;
  /** Also deletes the collection's commands. */
  delete(id: string): Promise<void>;
}

/** The fields of a command that the user edits. */
export type CommandInput = Pick<
  Command,
  "collectionId" | "name" | "template" | "description" | "tags" | "variables"
>;

export interface CommandRepository {
  list(): Promise<Command[]>;
  listByCollection(collectionId: string): Promise<Command[]>;
  create(input: CommandInput): Promise<Command>;
  update(id: string, input: CommandInput): Promise<void>;
  delete(id: string): Promise<void>;
  /** Records that the command was copied (RF-19). */
  recordUse(id: string): Promise<void>;
}
