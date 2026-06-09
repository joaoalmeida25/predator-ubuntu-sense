use std::{fs, str::FromStr};

use crate::{domain::performance::PerformanceProfile, errors::PredatorResult};

pub const PLATFORM_PROFILE_PATH: &str = "/sys/firmware/acpi/platform_profile";
pub const PLATFORM_PROFILE_CHOICES_PATH: &str = "/sys/firmware/acpi/platform_profile_choices";

pub fn get_current_profile() -> PredatorResult<PerformanceProfile> {
    let value = read_trimmed(PLATFORM_PROFILE_PATH)?;
    PerformanceProfile::from_str(&value).map_err(|error| anyhow::anyhow!(error))
}

pub fn list_available_profiles() -> PredatorResult<Vec<PerformanceProfile>> {
    let value = read_trimmed(PLATFORM_PROFILE_CHOICES_PATH)?;

    value
        .split_whitespace()
        .map(|profile| {
            PerformanceProfile::from_str(profile).map_err(|error| anyhow::anyhow!(error))
        })
        .collect()
}

pub fn set_profile(profile: PerformanceProfile) -> PredatorResult<()> {
    let available_profiles = list_available_profiles()?;

    if !available_profiles.contains(&profile) {
        anyhow::bail!(
            "profile '{}' is not available on this machine",
            profile.as_str()
        );
    }

    fs::write(PLATFORM_PROFILE_PATH, format!("{}\n", profile.as_str()))?;

    let current_profile = get_current_profile()?;

    if current_profile != profile {
        anyhow::bail!(
            "failed to apply profile '{}'. Current profile is '{}'",
            profile.as_str(),
            current_profile.as_str()
        );
    }

    Ok(())
}

fn read_trimmed(path: &str) -> PredatorResult<String> {
    Ok(fs::read_to_string(path)?.trim().to_string())
}
