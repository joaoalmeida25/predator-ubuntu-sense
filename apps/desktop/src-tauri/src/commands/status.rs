use std::{env, path::Path, process::Command};

#[tauri::command]
pub fn get_system_status() -> Result<String, String> {
    run_predatorctl(&["status"])
}

#[tauri::command]
pub fn get_driver_status() -> Result<String, String> {
    run_predatorctl(&["drivers", "status"])
}

fn run_predatorctl(args: &[&str]) -> Result<String, String> {
    let predatorctl_path = resolve_predatorctl_path();

    let output = Command::new(&predatorctl_path)
        .args(args)
        .output()
        .map_err(|error| {
            format!(
                "failed to execute predatorctl at '{}': {}",
                predatorctl_path, error
            )
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !output.status.success() {
        return Err(format!(
            "predatorctl failed with status: {}\nstdout: {}\nstderr: {}",
            output.status, stdout, stderr
        ));
    }

    Ok(stdout)
}

fn resolve_predatorctl_path() -> String {
    if let Ok(path) = env::var("PREDATORCTL_PATH") {
        return path;
    }

    if Path::new("/usr/local/bin/predatorctl").exists() {
        return "/usr/local/bin/predatorctl".to_string();
    }

    "predatorctl".to_string()
}
