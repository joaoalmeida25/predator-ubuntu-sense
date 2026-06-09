#!/usr/bin/env bash

set -euo pipefail

echo "Building Predator Ubuntu Sense binaries..."
cargo build

echo "Installing predatorctl to /usr/local/bin..."
sudo install -Dm755 target/debug/predatorctl /usr/local/bin/predatorctl

echo "Installing predator-helper to /usr/local/bin..."
sudo install -Dm755 target/debug/predator-helper /usr/local/bin/predator-helper

echo "Validating installation..."
command -v predatorctl
command -v predator-helper

echo
echo "Installed versions:"
predatorctl --help | head -n 5
predator-helper --help | head -n 5

echo
echo "Installation completed successfully."
