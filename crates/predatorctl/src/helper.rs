use std::{
    env,
    path::PathBuf,
    process::{Command, Stdio},
};

use anyhow::{Context, Result};

pub fn run_privileged_helper(args: &[&str]) -> Result<()> {
    let helper_path = resolve_helper_path()?;

    let output = Command::new(&helper_path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .with_context(|| {
            format!(
                "failed to execute predator-helper at '{}'",
                helper_path.display()
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        anyhow::bail!(
            "predator-helper failed\nstatus: {}\nstdout: {}\nstderr: {}",
            output.status,
            stdout.trim(),
            stderr.trim()
        );
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    if !stdout.trim().is_empty() {
        println!("{}", stdout.trim());
    }

    Ok(())
}

fn resolve_helper_path() -> Result<PathBuf> {
    if let Ok(path) = env::var("PREDATOR_HELPER_PATH") {
        return Ok(PathBuf::from(path));
    }

    let current_exe = env::current_exe().context("failed to resolve current executable path")?;

    if let Some(current_dir) = current_exe.parent() {
        let sibling_helper = current_dir.join("predator-helper");

        if sibling_helper.exists() {
            return Ok(sibling_helper);
        }
    }

    Ok(PathBuf::from("predator-helper"))
}
