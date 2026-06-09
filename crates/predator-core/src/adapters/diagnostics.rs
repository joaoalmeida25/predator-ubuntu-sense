use std::fs;
use std::process::Command;

use crate::errors::PredatorResult;

#[derive(Debug)]
pub struct DiagnosticsReport {
    pub model: Option<String>,
    pub kernel: Option<String>,
    pub current_profile: Option<String>,
    pub available_profiles: Option<String>,
    pub acer_rgb_available: bool,
    pub acer_rgb_device_available: bool,
}

pub fn get_diagnostics_report() -> PredatorResult<DiagnosticsReport> {
    Ok(DiagnosticsReport {
        model: run_command("sudo", &["dmidecode", "-s", "system-product-name"]).ok(),
        kernel: run_command("uname", &["-r"]).ok(),
        current_profile: read_trimmed("/sys/firmware/acpi/platform_profile").ok(),
        available_profiles: read_trimmed("/sys/firmware/acpi/platform_profile_choices").ok(),
        acer_rgb_available: command_exists("acer-rgb"),
        acer_rgb_device_available: fs::metadata("/dev/acer-rgb").is_ok(),
    })
}

fn read_trimmed(path: &str) -> PredatorResult<String> {
    Ok(fs::read_to_string(path)?.trim().to_string())
}

fn command_exists(command: &str) -> bool {
    Command::new("sh")
        .arg("-c")
        .arg(format!("command -v {}", command))
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn run_command(command: &str, args: &[&str]) -> PredatorResult<String> {
    let output = Command::new(command).args(args).output()?;

    if !output.status.success() {
        anyhow::bail!("command failed: {}", command);
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
