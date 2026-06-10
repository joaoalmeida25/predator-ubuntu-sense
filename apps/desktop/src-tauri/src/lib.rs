pub mod commands;

use commands::{
    performance::{
        get_current_performance_profile, list_performance_profiles, set_performance_profile,
    },
    status::{get_driver_status, get_system_status},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_status,
            get_driver_status,
            get_current_performance_profile,
            list_performance_profiles,
            set_performance_profile
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
