import { getDb } from "../../db/client";
import type { Collection } from "../../domain/models";
import { NotFoundError, type CollectionRepository } from "../types";

interface CollectionRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sqliteCollectionRepository: CollectionRepository = {
  async list() {
    const db = await getDb();
    const rows = await db.select<CollectionRow[]>(
      "SELECT id, name, created_at, updated_at FROM collections ORDER BY name COLLATE NOCASE",
    );
    return rows.map(toCollection);
  },

  async create(name) {
    const db = await getDb();
    const now = Date.now();
    const collection: Collection = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await db.execute(
      "INSERT INTO collections (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
      [collection.id, collection.name, collection.createdAt, collection.updatedAt],
    );
    return collection;
  },

  async rename(id, name) {
    const db = await getDb();
    const result = await db.execute(
      "UPDATE collections SET name = ?1, updated_at = ?2 WHERE id = ?3",
      [name.trim(), Date.now(), id],
    );
    if (result.rowsAffected === 0) throw new NotFoundError("Collection", id);
  },

  async delete(id) {
    const db = await getDb();
    // Its commands are removed by ON DELETE CASCADE in the same statement.
    const result = await db.execute("DELETE FROM collections WHERE id = ?1", [id]);
    if (result.rowsAffected === 0) throw new NotFoundError("Collection", id);
  },
};
