import { getDb } from "../../db/client";
import type { Command } from "../../domain/models";
import { NotFoundError, type CommandRepository } from "../types";

interface CommandRow {
  id: string;
  collection_id: string;
  name: string;
  template: string;
  description: string;
  tags: string; // JSON array
  variables: string; // JSON array
  copy_count: number;
  last_used_at: number | null;
  created_at: number;
  updated_at: number;
}

const COLUMNS =
  "id, collection_id, name, template, description, tags, variables, copy_count, last_used_at, created_at, updated_at";

function toCommand(row: CommandRow): Command {
  return {
    id: row.id,
    collectionId: row.collection_id,
    name: row.name,
    template: row.template,
    description: row.description,
    tags: JSON.parse(row.tags),
    variables: JSON.parse(row.variables),
    copyCount: row.copy_count,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sqliteCommandRepository: CommandRepository = {
  async list() {
    const db = await getDb();
    const rows = await db.select<CommandRow[]>(
      `SELECT ${COLUMNS} FROM commands ORDER BY name COLLATE NOCASE`,
    );
    return rows.map(toCommand);
  },

  async listByCollection(collectionId) {
    const db = await getDb();
    const rows = await db.select<CommandRow[]>(
      `SELECT ${COLUMNS} FROM commands WHERE collection_id = $1 ORDER BY name COLLATE NOCASE`,
      [collectionId],
    );
    return rows.map(toCommand);
  },

  async create(input) {
    const db = await getDb();
    const now = Date.now();
    const command: Command = {
      ...input,
      id: crypto.randomUUID(),
      name: input.name.trim(),
      copyCount: 0,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.execute(
      `INSERT INTO commands
         (id, collection_id, name, template, description, tags, variables, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        command.id,
        command.collectionId,
        command.name,
        command.template,
        command.description,
        JSON.stringify(command.tags),
        JSON.stringify(command.variables),
        command.createdAt,
        command.updatedAt,
      ],
    );
    return command;
  },

  async update(id, input) {
    const db = await getDb();
    const result = await db.execute(
      `UPDATE commands
         SET collection_id = $1, name = $2, template = $3, description = $4,
             tags = $5, variables = $6, updated_at = $7
       WHERE id = $8`,
      [
        input.collectionId,
        input.name.trim(),
        input.template,
        input.description,
        JSON.stringify(input.tags),
        JSON.stringify(input.variables),
        Date.now(),
        id,
      ],
    );
    if (result.rowsAffected === 0) throw new NotFoundError("Command", id);
  },

  async delete(id) {
    const db = await getDb();
    const result = await db.execute("DELETE FROM commands WHERE id = $1", [id]);
    if (result.rowsAffected === 0) throw new NotFoundError("Command", id);
  },

  async recordUse(id) {
    const db = await getDb();
    // Incrementing in SQL (not read-then-write) keeps this a single atomic statement.
    const result = await db.execute(
      "UPDATE commands SET copy_count = copy_count + 1, last_used_at = $1 WHERE id = $2",
      [Date.now(), id],
    );
    if (result.rowsAffected === 0) throw new NotFoundError("Command", id);
  },
};
