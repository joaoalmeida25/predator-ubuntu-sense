use super::command_runner::run_predatorctl;

#[tauri::command]
pub fn get_system_status() -> Result<String, String> {
    run_predatorctl(&["status"])
}

#[tauri::command]
pub fn get_driver_status() -> Result<String, String> {
    run_predatorctl(&["drivers", "status"])
}
