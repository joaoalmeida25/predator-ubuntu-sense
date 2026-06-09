#!/usr/bin/env bash

set -euo pipefail

MODPROBE_CONFIG="/etc/modprobe.d/predator-ubuntu-sense.conf"
MODULES_LOAD_CONFIG="/etc/modules-load.d/predator-ubuntu-sense.conf"

echo "Removing Predator Ubuntu Sense driver runtime configuration..."

if [ -f "$MODPROBE_CONFIG" ]; then
  sudo rm -f "$MODPROBE_CONFIG"
  echo "Removed $MODPROBE_CONFIG"
else
  echo "$MODPROBE_CONFIG not found"
fi

if [ -f "$MODULES_LOAD_CONFIG" ]; then
  sudo rm -f "$MODULES_LOAD_CONFIG"
  echo "Removed $MODULES_LOAD_CONFIG"
else
  echo "$MODULES_LOAD_CONFIG not found"
fi

echo
echo "Driver runtime configuration removed."
echo "Note: current loaded module state will remain until reload or reboot."
