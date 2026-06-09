use anyhow::Result;
use clap::{Parser, Subcommand};
use predator_core::adapters::diagnostics::get_diagnostics_report;

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
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Status => {
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
        }
    }

    Ok(())
}
