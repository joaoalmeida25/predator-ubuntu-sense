use std::process::Command;

use crate::{
    domain::rgb::{RgbColor, RgbDevice},
    errors::PredatorResult,
};

pub const ACER_RGB_COMMAND: &str = "acer-rgb";
pub const ACER_RGB_DEVICE: &str = "/dev/acer-rgb";

pub fn get_rgb_state() -> PredatorResult<String> {
    run_command(ACER_RGB_COMMAND, &["GET"])
}

pub fn set_static_color(device: RgbDevice, color: RgbColor, brightness: u8) -> PredatorResult<()> {
    if brightness > 100 {
        anyhow::bail!("brightness must be between 0 and 100");
    }

    for concrete_device in device.concrete_devices() {
        set_static_color_for_single_device(concrete_device, color, brightness)?;
    }

    Ok(())
}

fn set_static_color_for_single_device(
    device: RgbDevice,
    color: RgbColor,
    brightness: u8,
) -> PredatorResult<()> {
    let output = Command::new(ACER_RGB_COMMAND)
        .args([
            "SET",
            &format!("dev={}", device.as_str()),
            &format!("hidraw={}", ACER_RGB_DEVICE),
            "effect=static",
            &format!("bright={brightness}"),
            &format!("r={}", color.r),
            &format!("g={}", color.g),
            &format!("b={}", color.b),
            "zone=all",
        ])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!(
            "failed to set RGB color for '{}': {}",
            device.as_str(),
            stderr.trim()
        );
    }

    Ok(())
}

fn run_command(command: &str, args: &[&str]) -> PredatorResult<String> {
    let output = Command::new(command).args(args).output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("command failed '{}': {}", command, stderr.trim());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
