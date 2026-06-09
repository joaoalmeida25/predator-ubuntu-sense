use std::{
    env,
    path::{Path, PathBuf},
    process::{Command, Stdio},
};

use anyhow::{Context, Result};

pub fn run_privileged_helper(args: &[&str]) -> Result<()> {
    let helper_path = resolve_helper_path()?;

    let mut command = if is_root()? {
        let mut command = Command::new(&helper_path);
        command.args(args);
        command
    } else {
        let mut command = Command::new("pkexec");
        command.arg(&helper_path).args(args);
        command
    };

    let output = command
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

    let installed_helper = Path::new("/usr/local/bin/predator-helper");

    if installed_helper.exists() {
        return Ok(installed_helper.to_path_buf());
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

fn is_root() -> Result<bool> {
    let output = Command::new("id")
        .arg("-u")
        .output()
        .context("failed to check current user id")?;

    if !output.status.success() {
        anyhow::bail!("failed to check current user id");
    }

    let uid = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse::<u32>()
        .context("failed to parse current user id")?;

    Ok(uid == 0)
}
