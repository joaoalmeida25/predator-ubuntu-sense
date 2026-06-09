#!/usr/bin/env bash

set -euo pipefail

echo "Building Predator Ubuntu Sense binaries in release mode..."
cargo build --release

echo "Installing predatorctl to /usr/local/bin..."
sudo install -Dm755 target/release/predatorctl /usr/local/bin/predatorctl

echo "Installing predator-helper to /usr/local/bin..."
sudo install -Dm755 target/release/predator-helper /usr/local/bin/predator-helper

echo "Validating installation..."
command -v predatorctl
command -v predator-helper

echo
echo "Installed binaries:"
ls -l /usr/local/bin/predatorctl
ls -l /usr/local/bin/predator-helper

echo
echo "predatorctl:"
predatorctl --help | head -n 8

echo
echo "predator-helper:"
predator-helper --help | head -n 8

echo
echo "Installation completed successfully."
