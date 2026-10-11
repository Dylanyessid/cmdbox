use tauri_plugin_sql::{Migration, MigrationKind};

/// SQLite database, relative to the app config dir. Must match `DB_URL` in
/// `src/db/client.ts` and the `preload` entry in `tauri.conf.json`.
const DB_URL: &str = "sqlite:cmdbox.db";

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create collections and commands",
        sql: include_str!("../migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
