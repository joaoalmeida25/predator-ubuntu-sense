use serde::Serialize;

use super::command_runner::run_predatorctl;

const SUPPORTED_PROFILES: [&str; 5] = [
    "low-power",
    "quiet",
    "balanced",
    "balanced-performance",
    "performance",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PerformanceProfileDto {
    pub id: String,
    pub label: String,
    pub is_current: bool,
}

#[tauri::command]
pub fn get_current_performance_profile() -> Result<String, String> {
    run_predatorctl(&["profile", "get"])
}

#[tauri::command]
pub fn list_performance_profiles() -> Result<Vec<PerformanceProfileDto>, String> {
    let current_profile = get_current_performance_profile()?;
    let output = run_predatorctl(&["profile", "list"])?;

    Ok(output
        .lines()
        .filter_map(parse_profile_line)
        .map(|(id, label)| PerformanceProfileDto {
            is_current: id == current_profile,
            id,
            label,
        })
        .collect())
}

#[tauri::command]
pub fn set_performance_profile(profile: String) -> Result<String, String> {
    if !SUPPORTED_PROFILES.contains(&profile.as_str()) {
        return Err(format!("unsupported performance profile: {}", profile));
    }

    run_predatorctl(&["profile", "set", &profile])
}

fn parse_profile_line(line: &str) -> Option<(String, String)> {
    let line = line.trim();

    if line.is_empty() {
        return None;
    }

    if let Some((id, label)) = line.split_once(" (") {
        return Some((
            id.trim().to_string(),
            label.trim_end_matches(')').trim().to_string(),
        ));
    }

    Some((line.to_string(), line.to_string()))
}
