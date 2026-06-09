use anyhow::Result;
use clap::{Parser, Subcommand};
use predator_core::{
    adapters::{
        diagnostics::get_diagnostics_report,
        performance::{get_current_profile, list_available_profiles, set_profile},
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

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Status => {
            print_status()?;
        }

        Commands::Profile { command } => match command {
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

                set_profile(profile)?;

                println!(
                    "Performance profile changed to '{}' ({})",
                    profile.as_str(),
                    profile.friendly_name()
                );
            }
        },

        Commands::Rgb { command } => match command {
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
        "Kernel: {}",
        report.kernel.unwrap_or_else(|| "unknown".into())
    );
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
    println!("acer-rgb available: {}", report.acer_rgb_available);
    println!(
        "/dev/acer-rgb available: {}",
        report.acer_rgb_device_available
    );

    Ok(())
}
