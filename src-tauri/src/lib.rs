// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ollama;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:promptcraft.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create prompts schema",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                        sql: r#"
                            CREATE TABLE IF NOT EXISTS prompts (
                                id TEXT PRIMARY KEY,
                                title TEXT NOT NULL,
                                description TEXT NOT NULL,
                                category TEXT NOT NULL,
                                tags TEXT NOT NULL DEFAULT '[]',
                                system_instruction TEXT NOT NULL,
                                template TEXT NOT NULL,
                                model TEXT NOT NULL,
                                temperature REAL NOT NULL DEFAULT 0.7,
                                max_output_tokens INTEGER,
                                current_version_index INTEGER NOT NULL DEFAULT 0,
                                created_at TEXT NOT NULL,
                                updated_at TEXT NOT NULL
                            );

                            CREATE TABLE IF NOT EXISTS prompt_versions (
                                id TEXT PRIMARY KEY,
                                prompt_id TEXT NOT NULL,
                                version_string TEXT NOT NULL,
                                commit_message TEXT NOT NULL,
                                system_instruction TEXT NOT NULL,
                                template TEXT NOT NULL,
                                model TEXT NOT NULL,
                                temperature REAL NOT NULL DEFAULT 0.7,
                                max_output_tokens INTEGER,
                                created_at TEXT NOT NULL,
                                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
                            );

                            CREATE TABLE IF NOT EXISTS test_cases (
                                id TEXT PRIMARY KEY,
                                prompt_id TEXT NOT NULL,
                                name TEXT NOT NULL,
                                variables TEXT NOT NULL DEFAULT '{}',
                                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
                            );

                            CREATE INDEX IF NOT EXISTS idx_versions_prompt ON prompt_versions(prompt_id);
                            CREATE INDEX IF NOT EXISTS idx_testcases_prompt ON test_cases(prompt_id);
                        "#,
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::run_test,
            commands::optimize_prompt,
            commands::evaluate_prompts,
            commands::list_ollama_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
