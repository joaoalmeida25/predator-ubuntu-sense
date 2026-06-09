use anyhow::Result;
use clap::{Parser, Subcommand};
use predator_core::{
    adapters::{
        diagnostics::get_diagnostics_report,
        performance::{get_current_profile, list_available_profiles, set_profile},
    },
    domain::performance::PerformanceProfile,
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
