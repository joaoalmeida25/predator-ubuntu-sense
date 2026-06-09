use std::{
    fs,
    path::Path,
    process::Command,
    thread,
    time::{Duration, Instant},
};

use crate::errors::PredatorResult;

pub const PLATFORM_PROFILE_PATH: &str = "/sys/firmware/acpi/platform_profile";
pub const PLATFORM_PROFILE_CHOICES_PATH: &str = "/sys/firmware/acpi/platform_profile_choices";
pub const NITRO_SENSE_PATH: &str = "/sys/devices/platform/acer-wmi/nitro_sense";
pub const LINUWU_SENSE_MODULE_PATH: &str = "/sys/module/linuwu_sense";
pub const PLATFORM_PROFILE_MODULE_PATH: &str = "/sys/module/platform_profile";
pub const DAMX_DAEMON_SERVICE: &str = "damx-daemon.service";

const LINUWU_SENSE_MODULE: &str = "linuwu_sense";
const LINUWU_SENSE_MODPROBE_ARGS: [&str; 3] = ["linuwu_sense", "predator_v4=1", "enable_all=1"];

#[derive(Debug, Clone, Copy)]
pub enum DriverRuntimeFeature {
    PerformanceProfile,
    NitroSense,
}

#[derive(Debug, Clone)]
pub struct DriverRuntimeStatus {
    pub linuwu_sense_loaded: bool,
    pub platform_profile_module_loaded: bool,
    pub platform_profile_available: bool,
    pub platform_profile_choices_available: bool,
    pub nitro_sense_available: bool,
    pub damx_daemon_active: bool,
}

impl DriverRuntimeStatus {
    pub fn is_ready_for(&self, feature: DriverRuntimeFeature) -> bool {
        match feature {
            DriverRuntimeFeature::PerformanceProfile => {
                self.linuwu_sense_loaded
                    && self.platform_profile_module_loaded
                    && self.platform_profile_available
                    && self.platform_profile_choices_available
            }
            DriverRuntimeFeature::NitroSense => {
                self.linuwu_sense_loaded && self.nitro_sense_available
            }
        }
    }
}

pub fn get_driver_runtime_status() -> DriverRuntimeStatus {
    DriverRuntimeStatus {
        linuwu_sense_loaded: path_exists(LINUWU_SENSE_MODULE_PATH),
        platform_profile_module_loaded: path_exists(PLATFORM_PROFILE_MODULE_PATH),
        platform_profile_available: path_exists(PLATFORM_PROFILE_PATH),
        platform_profile_choices_available: path_exists(PLATFORM_PROFILE_CHOICES_PATH),
        nitro_sense_available: path_exists(NITRO_SENSE_PATH),
        damx_daemon_active: systemd_unit_is_active(DAMX_DAEMON_SERVICE),
    }
}

pub fn ensure_driver_runtime_ready(feature: DriverRuntimeFeature) -> PredatorResult<()> {
    let current_status = get_driver_runtime_status();

    if current_status.is_ready_for(feature) {
        return Ok(());
    }

    let initialized_status = initialize_driver_runtime()?;

    if initialized_status.is_ready_for(feature) {
        return Ok(());
    }

    anyhow::bail!(
        "driver runtime is not ready for {:?}. Current status: {:?}. \
         Expected linuwu_sense to expose platform_profile/nitro_sense using predator_v4=1 enable_all=1.",
        feature,
        initialized_status
    );
}

pub fn initialize_driver_runtime() -> PredatorResult<DriverRuntimeStatus> {
    // First, try the least invasive path using the validated PHN16-73 preset.
    run_command_allow_failure("modprobe", &LINUWU_SENSE_MODPROBE_ARGS);
    run_command_allow_failure("systemctl", &["restart", DAMX_DAEMON_SERVICE]);

    if wait_until_runtime_changes(Duration::from_secs(5)) {
        return Ok(get_driver_runtime_status());
    }

    // If the runtime is still not ready, do a clean reload attempt.
    run_command_allow_failure("systemctl", &["stop", DAMX_DAEMON_SERVICE]);
    run_command_allow_failure("modprobe", &["-r", LINUWU_SENSE_MODULE]);
    run_command_allow_failure("modprobe", &LINUWU_SENSE_MODPROBE_ARGS);
    run_command_allow_failure("systemctl", &["restart", DAMX_DAEMON_SERVICE]);

    wait_until_runtime_changes(Duration::from_secs(8));

    Ok(get_driver_runtime_status())
}

fn wait_until_runtime_changes(timeout: Duration) -> bool {
    let started_at = Instant::now();

    while started_at.elapsed() < timeout {
        let status = get_driver_runtime_status();

        if status.platform_profile_available || status.nitro_sense_available {
            return true;
        }

        thread::sleep(Duration::from_millis(250));
    }

    false
}

fn path_exists(path: &str) -> bool {
    Path::new(path).exists() || fs::metadata(path).is_ok()
}

fn systemd_unit_is_active(unit: &str) -> bool {
    Command::new("systemctl")
        .args(["is-active", "--quiet", unit])
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn run_command_allow_failure(command: &str, args: &[&str]) {
    let _ = Command::new(command).args(args).status();
}
