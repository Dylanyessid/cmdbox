import Database from "@tauri-apps/plugin-sql";

// Must match DB_URL in src-tauri/src/lib.rs, where the migrations are registered.
const DB_URL = "sqlite:cmdbox.db";

let db: Promise<Database> | undefined;

export function getDb(): Promise<Database> {
  db ??= Database.load(DB_URL).catch((error: unknown) => {
    // Don't cache a failed connection; let the next call retry.
    db = undefined;
    throw error;
  });
  return db;
}
