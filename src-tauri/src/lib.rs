mod ai;
mod commands;

use commands::{PcCwdState, ProjectState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(ProjectState {
            root: Default::default(),
        })
        .manage(PcCwdState {
            cwd: Default::default(),
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_settings,
            commands::save_settings,
            commands::memory_read_index,
            commands::memory_write_index,
            commands::memory_list_facts,
            commands::memory_read_fact,
            commands::memory_write_fact,
            commands::set_project_root,
            commands::get_project_root,
            commands::fs_read_file,
            commands::fs_write_file,
            commands::fs_delete_path,
            commands::fs_mkdir,
            commands::fs_list_dir,
            commands::run_shell_in_project,
            commands::set_pc_cwd,
            commands::get_pc_cwd,
            commands::run_shell_pc,
            commands::agents_run_applescript,
            commands::ai_chat_stream,
            commands::media_save_bytes,
            commands::openai_image_generate,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
