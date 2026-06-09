use std::fs;

use crate::errors::PredatorResult;

pub const BOOT_ANIMATION_SOUND_PATH: &str =
    "/sys/devices/platform/acer-wmi/nitro_sense/boot_animation_sound";

pub const BACKLIGHT_TIMEOUT_PATH: &str =
    "/sys/devices/platform/acer-wmi/nitro_sense/backlight_timeout";

pub fn get_boot_animation_sound() -> PredatorResult<bool> {
    read_bool_from_sysfs(BOOT_ANIMATION_SOUND_PATH)
}

pub fn set_boot_animation_sound(enabled: bool) -> PredatorResult<()> {
    write_bool_to_sysfs(BOOT_ANIMATION_SOUND_PATH, enabled)?;

    let current = get_boot_animation_sound()?;

    if current != enabled {
        anyhow::bail!(
            "failed to apply boot animation sound. Expected '{}', current '{}'",
            enabled,
            current
        );
    }

    Ok(())
}

pub fn get_backlight_timeout() -> PredatorResult<bool> {
    read_bool_from_sysfs(BACKLIGHT_TIMEOUT_PATH)
}

pub fn set_backlight_timeout(enabled: bool) -> PredatorResult<()> {
    write_bool_to_sysfs(BACKLIGHT_TIMEOUT_PATH, enabled)?;

    let current = get_backlight_timeout()?;

    if current != enabled {
        anyhow::bail!(
            "failed to apply backlight timeout. Expected '{}', current '{}'",
            enabled,
            current
        );
    }

    Ok(())
}

fn read_bool_from_sysfs(path: &str) -> PredatorResult<bool> {
    let value = fs::read_to_string(path)?.trim().to_string();

    match value.as_str() {
        "0" => Ok(false),
        "1" => Ok(true),
        invalid => anyhow::bail!("invalid boolean value '{}' at '{}'", invalid, path),
    }
}

fn write_bool_to_sysfs(path: &str, enabled: bool) -> PredatorResult<()> {
    let value = if enabled { "1\n" } else { "0\n" };
    fs::write(path, value)?;
    Ok(())
}
