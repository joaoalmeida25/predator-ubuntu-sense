# Predator Ubuntu Sense

Unofficial Linux control center for Acer Predator laptops.

This project is **not affiliated with Acer**. It targets Linux users who need a native alternative to parts of PredatorSense. Use it at your own risk, especially for hardware-control features.

## Current status

The project is in active early development and is currently centered on the Acer Predator PHN16-73 running Ubuntu Linux.

Validated environment:

```text
Model: Acer Predator PHN16-73
OS: Ubuntu 24.04
Kernel: 6.14.x
Secure Boot: disabled
RGB controller: ENEK5130 / 0CF2:5130
```

Available foundation today:

- Rust workspace with shared core logic, CLI, and privileged helper.
- `predatorctl` commands for diagnostics, driver runtime status, profiles, RGB, battery limiter, and device settings.
- Tauri + React desktop app under `apps/desktop`.
- Initial desktop dashboard that reads `predatorctl status` and `predatorctl drivers status` through Tauri commands.
- Controlled privileged operations are kept outside the React frontend.

## Architecture overview

This is a modular monorepo with Rust crates for system integration and a Tauri desktop app for the GUI.

```text
crates/
├── predator-core       # Shared domain and Linux integration logic
├── predatorctl         # User-facing CLI
└── predator-helper     # Privileged helper for controlled protected writes

apps/
└── desktop             # Tauri + React desktop application
```

The intended runtime boundary is:

```text
React UI -> Tauri commands -> predatorctl -> predator-core -> Linux interfaces
                                      |
                                      └-> predator-helper for privileged writes
```

The frontend must remain unprivileged. It should never read sysfs directly, call `pkexec`, or execute privileged commands itself.

## Main modules

### `crates/predator-core`

Shared Rust library with domain types, adapters, and hardware-facing integration logic.

Responsibilities include reading supported Linux interfaces, validating values, and exposing reusable capability-oriented APIs.

### `crates/predatorctl`

CLI entry point for normal user interaction and for the desktop app integration layer.

Examples:

```bash
predatorctl status
predatorctl drivers status
predatorctl profile get
predatorctl rgb get
```

### `crates/predator-helper`

Privileged helper used for controlled writes to protected system paths. The GUI should not run as root; write operations must remain centralized behind this helper path.

### `apps/desktop`

Tauri + React application. The current dashboard renders system and driver runtime status by invoking Tauri commands that call `predatorctl`.

## Local setup

Install the usual Rust and Node tooling, then install desktop dependencies:

```bash
cd apps/desktop
pnpm install
```

For hardware-backed functionality, the target machine must also have the expected Linux interfaces and runtime dependencies configured for the supported Acer Predator model.

## Main commands

Validate the Rust workspace:

```bash
cargo fmt
cargo check
```

Run CLI commands from source:

```bash
cargo run -p predatorctl -- status
cargo run -p predatorctl -- drivers status
cargo run -p predatorctl -- profile get
```

Build the desktop frontend:

```bash
cd apps/desktop
pnpm build
```

Run the desktop app in development mode:

```bash
cd apps/desktop
pnpm tauri dev
```

Install local release binaries:

```bash
./scripts/install-local.sh
```

## Roadmap

Short-term direction:

- Keep stabilizing the Rust capability layer and `predatorctl` contracts.
- Expand the Tauri desktop UI incrementally without bypassing the CLI/helper boundaries.
- Add frontend features by capability-oriented feature folders.
- Introduce performance, RGB, and settings screens only after the architecture and command contracts are stable.
- Improve packaging and installation flow for supported Ubuntu setups.

## Safety note

Hardware-control behavior depends on model-specific Linux interfaces. Do not assume compatibility with other Acer Predator or Nitro models without validating the available sysfs paths, kernel support, and external driver/runtime dependencies.
