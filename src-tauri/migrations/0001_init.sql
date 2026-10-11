-- Initial schema: collections and their commands.
--
-- Every write the app performs must be a single statement, because
-- tauri-plugin-sql runs each call on any connection of its pool, so
-- BEGIN/COMMIT sent from the frontend are not guaranteed to share one.
-- That is why:
--   * tags and variables are JSON columns on `commands` (they are always
--     read and written together with their command), and
--   * deleting a collection removes its commands through ON DELETE CASCADE.

CREATE TABLE collections (
    id         TEXT    PRIMARY KEY NOT NULL,
    name       TEXT    NOT NULL CHECK (length(trim(name)) > 0),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE commands (
    id            TEXT    PRIMARY KEY NOT NULL,
    collection_id TEXT    NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    name          TEXT    NOT NULL CHECK (length(trim(name)) > 0),
    template      TEXT    NOT NULL,
    description   TEXT    NOT NULL DEFAULT '',
    tags          TEXT    NOT NULL DEFAULT '[]'
                          CHECK (json_valid(tags) AND json_type(tags) = 'array'),
    variables     TEXT    NOT NULL DEFAULT '[]'
                          CHECK (json_valid(variables) AND json_type(variables) = 'array'),
    copy_count    INTEGER NOT NULL DEFAULT 0 CHECK (copy_count >= 0),
    last_used_at  INTEGER,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_commands_collection_id ON commands (collection_id);
