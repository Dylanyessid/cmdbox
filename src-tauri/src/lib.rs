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

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
