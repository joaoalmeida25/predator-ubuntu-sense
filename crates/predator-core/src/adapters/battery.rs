use std::fs;

use crate::errors::PredatorResult;

pub const BATTERY_LIMITER_PATH: &str = "/sys/devices/platform/acer-wmi/nitro_sense/battery_limiter";

pub fn get_battery_limiter() -> PredatorResult<bool> {
    read_bool_from_sysfs(BATTERY_LIMITER_PATH)
}

pub fn set_battery_limiter(enabled: bool) -> PredatorResult<()> {
    write_bool_to_sysfs(BATTERY_LIMITER_PATH, enabled)?;

    let current = get_battery_limiter()?;

    if current != enabled {
        anyhow::bail!(
            "failed to apply battery limiter. Expected '{}', current '{}'",
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
