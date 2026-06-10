# Predator Ubuntu Sense — Frontend Improvements Backlog

This document tracks visual placeholders, mocked telemetry and follow-up improvements identified after the Dashboard and Performance visual refactor.

## Dashboard

### Mocked or placeholder data

- Device Overview specs are currently hardcoded in the React Dashboard controller.
  - Future improvement: parse real model, BIOS, kernel and hardware information from `predatorctl status` or create structured Tauri commands.
- System Status gauges for CPU temperature, GPU temperature and system load are mocked.
  - Future improvement: add telemetry collection through Linux sensors, NVIDIA tooling or a safe `predatorctl telemetry` command.
- Performance Summary values for CPU, GPU, RAM and Storage are mocked.
  - Future improvement: provide structured runtime metrics from Rust/Tauri instead of static UI data.
- AI Core metrics such as neural nodes, learning rate, model status, AI engine and prediction accuracy are visual-only concepts.
  - Future improvement: decide whether this remains a decorative hero component or maps to real optimization/status features.
- System Status Output still displays raw command/status output.
  - Future improvement: replace raw output with structured diagnostics cards after telemetry commands mature.

### Visual / UX follow-ups

- Replace the CSS/SVG AI Core preview with a real WebGL implementation when the visual direction is stable.
  - Candidate stack: `three`, `@react-three/fiber`, `@react-three/drei`.
- Improve Dashboard responsiveness for very small windows after the desktop-first layout stabilizes.
- Consider removing System Status Output later if structured diagnostics fully replace it.

## Performance

### Mocked or placeholder data

- System Performance CPU/GPU utilization, frequency and temperature are mocked.
  - Future improvement: add structured telemetry command for CPU/GPU runtime stats.
- Thermal Overview temperatures are mocked.
  - Future improvement: integrate with Linux sensors and/or GPU driver telemetry.
- Fan & Cooling is visual-only and disabled.
  - Future improvement: investigate whether fan control is safely available for this model before making it functional.
- Profile Manager is disabled.
  - Future improvement: implement custom profile presets only after base profile switching is stable.

### Functional notes

- Profile list and profile switching are real and use Tauri commands backed by `predatorctl`.
- The profile visual mapping is intentionally aligned with the physical profile button color expectations:
  - Eco: green
  - Quiet: white / neutral
  - Balanced: blue
  - Performance: darker purple
  - Turbo: magenta / pink-violet

## Shared UI / assets

- The app uses original SVG artwork for branding and device visuals to avoid shipping official Acer/Predator assets.
- Laptop and thermal overview images are lightweight SVG placeholders designed to match the visual direction.
- Future improvement: replace placeholders with higher fidelity original illustrations if needed, while keeping file sizes small.

## Permission / installation follow-up

- Passwordless Polkit rule is still a separate topic and should be treated as installation/packaging work.
- Future improvement: define final packaging behavior for local installs so users do not need to manually repeat permission setup steps unnecessarily.
