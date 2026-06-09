#!/usr/bin/env bash

set -euo pipefail

echo "Removing Predator Ubuntu Sense binaries from /usr/local/bin..."

if [ -f /usr/local/bin/predatorctl ]; then
  sudo rm -f /usr/local/bin/predatorctl
  echo "Removed /usr/local/bin/predatorctl"
else
  echo "/usr/local/bin/predatorctl not found"
fi

if [ -f /usr/local/bin/predator-helper ]; then
  sudo rm -f /usr/local/bin/predator-helper
  echo "Removed /usr/local/bin/predator-helper"
else
  echo "/usr/local/bin/predator-helper not found"
fi

echo
echo "Validating removal..."

if command -v predatorctl >/dev/null 2>&1; then
  echo "Warning: predatorctl is still available at: $(command -v predatorctl)"
else
  echo "predatorctl removed from PATH"
fi

if command -v predator-helper >/dev/null 2>&1; then
  echo "Warning: predator-helper is still available at: $(command -v predator-helper)"
else
  echo "predator-helper removed from PATH"
fi

echo
echo "Uninstall completed."
