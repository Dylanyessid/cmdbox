import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type Database from "@tauri-apps/plugin-sql";

const MIGRATIONS_DIR = new URL("../../src-tauri/migrations/", import.meta.url);

export type TestDatabase = Pick<Database, "select" | "execute">;

/**
 * An in-memory SQLite database with the app's real migrations applied,
 * exposing the subset of the tauri-plugin-sql API that the repositories use.
 */
export function createTestDatabase(): TestDatabase {
  const db = new DatabaseSync(":memory:");
  // sqlx enables this on every connection; SQLite leaves it off by default.
  db.exec("PRAGMA foreign_keys = ON");

  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(file, MIGRATIONS_DIR), "utf8"));
  }

  return {
    async select<T>(query: string, bindValues: unknown[] = []) {
      return db.prepare(query).all(...(bindValues as SQLInputValue[])) as T;
    },
    async execute(query: string, bindValues: unknown[] = []) {
      const result = db.prepare(query).run(...(bindValues as SQLInputValue[]));
      return {
        rowsAffected: Number(result.changes),
        lastInsertId: Number(result.lastInsertRowid),
      };
    },
  };
}
