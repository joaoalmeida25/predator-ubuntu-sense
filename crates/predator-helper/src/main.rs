use anyhow::Result;
use clap::{Parser, Subcommand};
use predator_core::{
    adapters::{
        battery::set_battery_limiter,
        device_settings::{set_backlight_timeout, set_boot_animation_sound},
        performance::set_profile,
    },
    domain::performance::PerformanceProfile,
};

#[derive(Parser)]
#[command(name = "predator-helper")]
#[command(about = "Privileged helper for Predator Ubuntu Sense")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Set performance profile
    Profile {
        #[command(subcommand)]
        command: ProfileCommand,
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
}

#[derive(Subcommand)]
enum ProfileCommand {
    /// Set performance profile
    Set {
        /// Available values: low-power, quiet, balanced, balanced-performance, performance
        profile: String,
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
    /// Enable feature
    On,

    /// Disable feature
    Off,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Profile { command } => handle_profile_command(command)?,
        Commands::Battery { command } => handle_battery_command(command)?,
        Commands::Settings { command } => handle_settings_command(command)?,
    }

    Ok(())
}

fn handle_profile_command(command: ProfileCommand) -> Result<()> {
    match command {
        ProfileCommand::Set { profile } => {
            let profile = profile
                .parse::<PerformanceProfile>()
                .map_err(anyhow::Error::msg)?;

            set_profile(profile)?;

            println!(
                "Performance profile changed to '{}' ({})",
                profile.as_str(),
                profile.friendly_name()
            );
        }
    }

    Ok(())
}

fn handle_battery_command(command: BatteryCommand) -> Result<()> {
    match command {
        BatteryCommand::Limiter { command } => match command {
            ToggleCommand::On => {
                set_battery_limiter(true)?;
                println!("Battery limiter enabled");
            }

            ToggleCommand::Off => {
                set_battery_limiter(false)?;
                println!("Battery limiter disabled");
            }
        },
    }

    Ok(())
}

fn handle_settings_command(command: SettingsCommand) -> Result<()> {
    match command {
        SettingsCommand::BootSound { command } => match command {
            ToggleCommand::On => {
                set_boot_animation_sound(true)?;
                println!("Boot animation sound enabled");
            }

            ToggleCommand::Off => {
                set_boot_animation_sound(false)?;
                println!("Boot animation sound disabled");
            }
        },

        SettingsCommand::BacklightTimeout { command } => match command {
            ToggleCommand::On => {
                set_backlight_timeout(true)?;
                println!("Backlight timeout enabled");
            }

            ToggleCommand::Off => {
                set_backlight_timeout(false)?;
                println!("Backlight timeout disabled");
            }
        },
    }

    Ok(())
}
