# Predator Ubuntu Sense

Unofficial Linux control center for Acer Predator laptops.

This project is **not affiliated with Acer**. Use it at your own risk.

## Current status

This project is currently focused on the **Acer Predator PHN16-73** running Ubuntu Linux.

Validated environment:

```text
Model: Acer Predator PHN16-73
OS: Ubuntu 24.04
Kernel: 6.14.x
Secure Boot: disabled
RGB controller: ENEK5130 / 0CF2:5130
```

Implemented features:

- System diagnostics
- RGB control through `acer-rgb` / `acer-rgbd`
- Performance profile control through Linux `platform_profile`
- Battery limiter control
- Boot animation sound control
- Keyboard backlight timeout control
- Privileged helper for controlled sysfs writes

## Why this project exists

Acer Predator laptops usually depend on **PredatorSense** on Windows to control performance modes, fan behavior, keyboard lighting, battery options, and other device-specific settings.

On Linux, there is no official PredatorSense equivalent for many models. This project aims to provide a clean, open-source, Linux-first control layer for supported Acer Predator laptops.

The first supported target is the **Predator PHN16-73**, because it has already been validated with:

- `Div-Linuwu-Sense` / DAMX for system-level Predator/Nitro features
- Linux `platform_profile` for performance profile switching
- `acer-lighting-daemon` for RGB control through the ENEK5130 HID controller

## Architecture

The project is split into three Rust crates:

```text
crates/
├── predator-core
├── predatorctl
└── predator-helper
```

### `predator-core`

Shared library containing domain types, adapters, and hardware integration logic.

It is responsible for knowing how to read and write supported Linux paths, but it does not define the final user interface.

Examples of responsibilities:

- Read current performance profile
- List available performance profiles
- Apply validated performance profile
- Read and apply RGB settings
- Read and toggle battery limiter
- Read and toggle device settings

### `predatorctl`

Command-line interface used by the user.

It handles normal read commands directly and delegates privileged write operations to `predator-helper`.

Examples:

```bash
predatorctl status
predatorctl profile get
predatorctl rgb get
predatorctl rgb set all --color '#500082' --brightness 80
```

### `predator-helper`

Privileged helper responsible for controlled writes to protected Linux sysfs paths.

It should be executed with elevated privileges for commands that change system state, such as:

```bash
sudo predatorctl profile set performance
sudo predatorctl battery limiter on
sudo predatorctl settings boot-sound off
```

The helper exists so that the future graphical interface does **not** need to run as root.

## Design principles

This project follows a few important decisions:

### Do not rewrite kernel drivers initially

The project does not attempt to reimplement WMI, EC, ACPI, HID, or kernel-level driver behavior.

Instead, it uses already working Linux interfaces and tools as integration points.

### Do not copy code from existing projects

The project can depend on external tools and drivers, but the application code itself should remain original.

### One adapter per technical capability

The internal architecture is organized by capability, not by UI screen.

Examples:

```text
DiagnosticsAdapter
PerformanceAdapter
RgbAdapter
BatteryAdapter
DeviceSettingsAdapter
```

### Keep the UI unprivileged

The future Tauri/React interface must run as a normal user process.

Privileged writes should go through a narrow helper layer.

## External dependencies

Expected system dependencies:

- `acer-rgb`
- `acer-rgbd`
- `/dev/acer-rgb`
- `linuwu_sense`
- Linux `platform_profile`

Validated sysfs paths on PHN16-73:

```text
/sys/firmware/acpi/platform_profile
/sys/firmware/acpi/platform_profile_choices
/sys/devices/platform/acer-wmi/nitro_sense/battery_limiter
/sys/devices/platform/acer-wmi/nitro_sense/boot_animation_sound
/sys/devices/platform/acer-wmi/nitro_sense/backlight_timeout
```

## Local development

Check the Rust workspace:

```bash
cargo fmt
cargo check
cargo build
```

Run the CLI from source:

```bash
cargo run -p predatorctl -- status
cargo run -p predatorctl -- profile get
cargo run -p predatorctl -- profile list
cargo run -p predatorctl -- rgb get
```

Run privileged operations from local build:

```bash
sudo target/debug/predatorctl profile set balanced
sudo target/debug/predatorctl profile set performance
sudo target/debug/predatorctl battery limiter on
sudo target/debug/predatorctl battery limiter off
```

## Local installation

Install release binaries to `/usr/local/bin`:

```bash
./scripts/install-local.sh
```

Installed binaries:

```text
/usr/local/bin/predatorctl
/usr/local/bin/predator-helper
```

Validate:

```bash
predatorctl status
predatorctl profile get
predatorctl rgb get
```

## Usage

### Diagnostics

```bash
predatorctl status
```

Expected output includes:

- Model
- BIOS version
- Kernel
- Driver/service status
- Current performance profile
- Available profiles
- Battery/settings state
- RGB state

### RGB

Read RGB daemon state:

```bash
predatorctl rgb get
```

Set keyboard color:

```bash
predatorctl rgb set keyboard --color '#500082' --brightness 80
```

Set all supported RGB devices:

```bash
predatorctl rgb set all --color '#500082' --brightness 80
```

Supported RGB devices:

```text
keyboard
lid
button
all
```

### Performance profiles

Read operations do not require sudo:

```bash
predatorctl profile get
predatorctl profile list
```

Write operations currently require sudo:

```bash
sudo predatorctl profile set low-power
sudo predatorctl profile set quiet
sudo predatorctl profile set balanced
sudo predatorctl profile set balanced-performance
sudo predatorctl profile set performance
```

Current profile mapping used by the project:

```text
low-power              -> Eco
quiet                  -> Quiet
balanced               -> Balanced
balanced-performance   -> Performance
performance            -> Turbo
```

### Battery limiter

Read battery limiter state:

```bash
predatorctl battery limiter get
```

Enable or disable battery limiter:

```bash
sudo predatorctl battery limiter on
sudo predatorctl battery limiter off
```

### Device settings

Boot animation sound:

```bash
predatorctl settings boot-sound get
sudo predatorctl settings boot-sound off
sudo predatorctl settings boot-sound on
```

Keyboard backlight timeout:

```bash
predatorctl settings backlight-timeout get
sudo predatorctl settings backlight-timeout on
sudo predatorctl settings backlight-timeout off
```

## Local uninstall

Remove installed binaries:

```bash
./scripts/uninstall-local.sh
```

This removes:

```text
/usr/local/bin/predatorctl
/usr/local/bin/predator-helper
```

## Repository structure

```text
.
├── crates/
│   ├── predator-core/
│   │   └── src/
│   │       ├── adapters/
│   │       ├── domain/
│   │       ├── errors.rs
│   │       └── lib.rs
│   │
│   ├── predatorctl/
│   │   └── src/
│   │       ├── helper.rs
│   │       └── main.rs
│   │
│   └── predator-helper/
│       └── src/
│           └── main.rs
│
├── scripts/
│   ├── install-local.sh
│   └── uninstall-local.sh
│
├── Cargo.toml
├── Cargo.lock
└── README.md
```

## Roadmap

Next steps:

- Add a safer privilege elevation strategy using `pkexec` / Polkit
- Add local packaging
- Build a Tauri + React desktop interface
- Add user presets
- Add configuration persistence
- Add fan control after safe validation
- Investigate physical profile button mapping
- Expand compatibility to other Acer Predator/Nitro models

## Safety notes

This project interacts with low-level Linux system interfaces.

Do not write arbitrary values to unknown sysfs paths.

Currently validated write targets are limited to:

```text
/sys/firmware/acpi/platform_profile
/sys/devices/platform/acer-wmi/nitro_sense/battery_limiter
/sys/devices/platform/acer-wmi/nitro_sense/boot_animation_sound
/sys/devices/platform/acer-wmi/nitro_sense/backlight_timeout
```

Fan control is intentionally not implemented yet because it requires additional validation.

## License

MIT
