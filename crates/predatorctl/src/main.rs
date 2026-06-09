mod helper;

use anyhow::Result;
use clap::{Parser, Subcommand};
use helper::run_privileged_helper;
use predator_core::{
    adapters::{
        battery::get_battery_limiter,
        device_settings::{get_backlight_timeout, get_boot_animation_sound},
        diagnostics::get_diagnostics_report,
        driver_runtime::get_driver_runtime_status,
        performance::{get_current_profile, list_available_profiles},
        rgb::{get_rgb_state, set_static_color},
    },
    domain::{
        performance::PerformanceProfile,
        rgb::{RgbColor, RgbDevice},
    },
};

#[derive(Parser)]
#[command(name = "predatorctl")]
#[command(about = "Unofficial CLI for controlling Acer Predator laptops on Linux")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Show system and driver diagnostics
    Status,

    /// Manage performance profiles
    Profile {
        #[command(subcommand)]
        command: ProfileCommand,
    },

    /// Manage RGB lighting
    Rgb {
        #[command(subcommand)]
        command: RgbCommand,
    },

    /// Manage battery features
    Battery {
        #[command(subcommand)]
        command: BatteryCommand,
    },

    /// Manage device settings
    Settings {
        #[command(subcommand)]
        command: SettingsCommand,
    },

    /// Manage Linux driver runtime
    Drivers {
        #[command(subcommand)]
        command: DriversCommand,
    },
}

#[derive(Subcommand)]
enum DriversCommand {
    /// Show driver runtime status
    Status,

    /// Initialize Linux driver runtime
    Init,
}

#[derive(Subcommand)]
enum ProfileCommand {
    /// Show current performance profile
    Get,

    /// List available performance profiles
    List,

    /// Set performance profile
    Set {
        /// Available values: low-power, quiet, balanced, balanced-performance, performance
        profile: String,
    },
}

#[derive(Subcommand)]
enum RgbCommand {
    /// Show current RGB daemon state
    Get,

    /// Set static RGB color
    Set {
        /// Available values: keyboard, lid, button, all
        device: String,

        /// Hex color, for example: #500082
        #[arg(long)]
        color: String,

        /// Brightness from 0 to 100
        #[arg(long, default_value_t = 80)]
        brightness: u8,
    },
}

#[derive(Subcommand)]
enum BatteryCommand {
    /// Manage battery limiter
    Limiter {
        #[command(subcommand)]
        command: ToggleCommand,
    },
}

#[derive(Subcommand)]
enum SettingsCommand {
    /// Manage boot animation sound
    BootSound {
        #[command(subcommand)]
        command: ToggleCommand,
    },

    /// Manage keyboard backlight timeout
    BacklightTimeout {
        #[command(subcommand)]
        command: ToggleCommand,
    },
}

#[derive(Subcommand)]
enum ToggleCommand {
    /// Show current value
    Get,

    /// Enable feature
    On,

    /// Disable feature
    Off,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Status => {
            print_status()?;
        }

        Commands::Profile { command } => handle_profile_command(command)?,

        Commands::Rgb { command } => handle_rgb_command(command)?,

        Commands::Battery { command } => handle_battery_command(command)?,

        Commands::Settings { command } => handle_settings_command(command)?,

        Commands::Drivers { command } => handle_drivers_command(command)?,
    }

    Ok(())
}

fn handle_drivers_command(command: DriversCommand) -> Result<()> {
    match command {
        DriversCommand::Status => {
            let status = get_driver_runtime_status();

            println!("Predator Ubuntu Sense - Driver Runtime");
            println!("--------------------------------------");
            println!("linuwu_sense loaded: {}", status.linuwu_sense_loaded);
            println!(
                "platform_profile module loaded: {}",
                status.platform_profile_module_loaded
            );
            println!(
                "platform_profile available: {}",
                status.platform_profile_available
            );
            println!(
                "platform_profile choices available: {}",
                status.platform_profile_choices_available
            );
            println!("nitro_sense available: {}", status.nitro_sense_available);
            println!("DAMX daemon active: {}", status.damx_daemon_active);
        }

        DriversCommand::Init => {
            run_privileged_helper(&["drivers", "init"])?;
        }
    }

    Ok(())
}

fn handle_profile_command(command: ProfileCommand) -> Result<()> {
    match command {
        ProfileCommand::Get => {
            let profile = get_current_profile()?;
            println!("{}", profile.as_str());
        }

        ProfileCommand::List => {
            let profiles = list_available_profiles()?;

            for profile in profiles {
                println!("{} ({})", profile.as_str(), profile.friendly_name());
            }
        }

        ProfileCommand::Set { profile } => {
            let profile = profile
                .parse::<PerformanceProfile>()
                .map_err(anyhow::Error::msg)?;

            run_privileged_helper(&["profile", "set", profile.as_str()])?;
        }
    }

    Ok(())
}

fn handle_rgb_command(command: RgbCommand) -> Result<()> {
    match command {
        RgbCommand::Get => {
            let state = get_rgb_state()?;
            println!("{state}");
        }

        RgbCommand::Set {
            device,
            color,
            brightness,
        } => {
            let device = device.parse::<RgbDevice>().map_err(anyhow::Error::msg)?;
            let color = RgbColor::from_hex(&color).map_err(anyhow::Error::msg)?;

            set_static_color(device, color, brightness)?;

            println!(
                "RGB color changed for '{}' to #{:02X}{:02X}{:02X} with brightness {}",
                device.as_str(),
                color.r,
                color.g,
                color.b,
                brightness
            );
        }
    }

    Ok(())
}

fn handle_battery_command(command: BatteryCommand) -> Result<()> {
    match command {
        BatteryCommand::Limiter { command } => match command {
            ToggleCommand::Get => {
                let enabled = get_battery_limiter()?;
                println!("{}", format_enabled(enabled));
            }

            ToggleCommand::On => {
                run_privileged_helper(&["battery", "limiter", "on"])?;
            }

            ToggleCommand::Off => {
                run_privileged_helper(&["battery", "limiter", "off"])?;
            }
        },
    }

    Ok(())
}

fn handle_settings_command(command: SettingsCommand) -> Result<()> {
    match command {
        SettingsCommand::BootSound { command } => match command {
            ToggleCommand::Get => {
                let enabled = get_boot_animation_sound()?;
                println!("{}", format_enabled(enabled));
            }

            ToggleCommand::On => {
                run_privileged_helper(&["settings", "boot-sound", "on"])?;
            }

            ToggleCommand::Off => {
                run_privileged_helper(&["settings", "boot-sound", "off"])?;
            }
        },

        SettingsCommand::BacklightTimeout { command } => match command {
            ToggleCommand::Get => {
                let enabled = get_backlight_timeout()?;
                println!("{}", format_enabled(enabled));
            }

            ToggleCommand::On => {
                run_privileged_helper(&["settings", "backlight-timeout", "on"])?;
            }

            ToggleCommand::Off => {
                run_privileged_helper(&["settings", "backlight-timeout", "off"])?;
            }
        },
    }

    Ok(())
}

fn print_status() -> Result<()> {
    let report = get_diagnostics_report()?;

    println!("Predator Ubuntu Sense - Diagnostics");
    println!("------------------------------------");
    println!(
        "Model: {}",
        report.model.unwrap_or_else(|| "unknown".into())
    );
    println!(
        "BIOS: {}",
        report.bios_version.unwrap_or_else(|| "unknown".into())
    );
    println!(
        "Kernel: {}",
        report.kernel.unwrap_or_else(|| "unknown".into())
    );

    println!();
    println!("Drivers / Services");
    println!("linuwu_sense loaded: {}", report.linuwu_sense_loaded);
    println!("acer-rgb available: {}", report.acer_rgb_available);
    println!(
        "/dev/acer-rgb available: {}",
        report.acer_rgb_device_available
    );
    println!("acer-rgbd active: {}", report.acer_rgbd_active);
    println!("DAMX daemon active: {}", report.damx_daemon_active);

    println!();
    println!("Performance");
    println!(
        "Current profile: {}",
        report.current_profile.unwrap_or_else(|| "unknown".into())
    );
    println!(
        "Available profiles: {}",
        report
            .available_profiles
            .unwrap_or_else(|| "unknown".into())
    );

    println!();
    println!("Battery / Settings");
    println!(
        "Battery limiter: {}",
        format_optional_enabled(report.battery_limiter)
    );
    println!(
        "Boot animation sound: {}",
        format_optional_enabled(report.boot_animation_sound)
    );
    println!(
        "Backlight timeout: {}",
        format_optional_enabled(report.backlight_timeout)
    );

    println!();
    println!("RGB state:");
    match report.rgb_state {
        Some(state) => println!("{state}"),
        None => println!("unknown"),
    }

    Ok(())
}

fn format_enabled(enabled: bool) -> &'static str {
    if enabled {
        "on"
    } else {
        "off"
    }
}

fn format_optional_enabled(value: Option<bool>) -> &'static str {
    match value {
        Some(true) => "on",
        Some(false) => "off",
        None => "unknown",
    }
}
