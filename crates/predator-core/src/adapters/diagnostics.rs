use std::fs;
use std::process::Command;

use crate::adapters::{
    battery::get_battery_limiter,
    device_settings::{get_backlight_timeout, get_boot_animation_sound},
    performance::{get_current_profile, list_available_profiles},
    rgb::get_rgb_state,
};
use crate::errors::PredatorResult;

#[derive(Debug)]
pub struct DiagnosticsReport {
    pub model: Option<String>,
    pub bios_version: Option<String>,
    pub kernel: Option<String>,

    pub current_profile: Option<String>,
    pub available_profiles: Option<String>,

    pub acer_rgb_available: bool,
    pub acer_rgb_device_available: bool,
    pub acer_rgbd_active: bool,

    pub linuwu_sense_loaded: bool,
    pub damx_daemon_active: bool,

    pub battery_limiter: Option<bool>,
    pub boot_animation_sound: Option<bool>,
    pub backlight_timeout: Option<bool>,

    pub rgb_state: Option<String>,
}

pub fn get_diagnostics_report() -> PredatorResult<DiagnosticsReport> {
    let current_profile = get_current_profile()
        .ok()
        .map(|profile| profile.as_str().to_string());

    let available_profiles = list_available_profiles().ok().map(|profiles| {
        profiles
            .iter()
            .map(|profile| profile.as_str())
            .collect::<Vec<_>>()
            .join(" ")
    });

    Ok(DiagnosticsReport {
        model: read_optional("/sys/class/dmi/id/product_name"),
        bios_version: read_optional("/sys/class/dmi/id/bios_version"),
        kernel: run_command("uname", &["-r"]).ok(),

        current_profile,
        available_profiles,

        acer_rgb_available: command_exists("acer-rgb"),
        acer_rgb_device_available: fs::metadata("/dev/acer-rgb").is_ok(),
        acer_rgbd_active: systemd_unit_is_active("acer-rgbd.service"),

        linuwu_sense_loaded: fs::metadata("/sys/module/linuwu_sense").is_ok(),
        damx_daemon_active: systemd_unit_is_active("damx-daemon.service"),

        battery_limiter: get_battery_limiter().ok(),
        boot_animation_sound: get_boot_animation_sound().ok(),
        backlight_timeout: get_backlight_timeout().ok(),

        rgb_state: get_rgb_state().ok(),
    })
}

fn read_optional(path: &str) -> Option<String> {
    fs::read_to_string(path)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn command_exists(command: &str) -> bool {
    Command::new("sh")
        .arg("-c")
        .arg(format!("command -v {}", command))
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn systemd_unit_is_active(unit: &str) -> bool {
    Command::new("systemctl")
        .args(["is-active", "--quiet", unit])
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn run_command(command: &str, args: &[&str]) -> PredatorResult<String> {
    let output = Command::new(command).args(args).output()?;

    if !output.status.success() {
        anyhow::bail!("command failed: {}", command);
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
