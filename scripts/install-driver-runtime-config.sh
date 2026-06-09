#!/usr/bin/env bash

set -euo pipefail

MODPROBE_CONFIG="/etc/modprobe.d/predator-ubuntu-sense.conf"
MODULES_LOAD_CONFIG="/etc/modules-load.d/predator-ubuntu-sense.conf"

echo "Installing Predator Ubuntu Sense driver runtime configuration..."

echo "options linuwu_sense predator_v4=1 enable_all=1" | sudo tee "$MODPROBE_CONFIG" >/dev/null
echo "linuwu_sense" | sudo tee "$MODULES_LOAD_CONFIG" >/dev/null

echo "Installed:"
ls -l "$MODPROBE_CONFIG"
ls -l "$MODULES_LOAD_CONFIG"

echo
echo "Reloading linuwu_sense with Predator PHN16-73 preset..."

sudo systemctl stop damx-daemon.service 2>/dev/null || true
sudo modprobe -r linuwu_sense 2>/dev/null || true
sudo modprobe linuwu_sense predator_v4=1 enable_all=1
sudo systemctl restart damx-daemon.service 2>/dev/null || true

echo
echo "Current linuwu_sense parameters:"
echo "predator_v4=$(cat /sys/module/linuwu_sense/parameters/predator_v4 2>/dev/null || echo unknown)"
echo "enable_all=$(cat /sys/module/linuwu_sense/parameters/enable_all 2>/dev/null || echo unknown)"

echo
echo "Runtime paths:"
if [ -e /sys/firmware/acpi/platform_profile ]; then
  echo "platform_profile: available"
else
  echo "platform_profile: missing"
fi

if [ -e /sys/firmware/acpi/platform_profile_choices ]; then
  echo "platform_profile_choices: available"
else
  echo "platform_profile_choices: missing"
fi

if [ -d /sys/devices/platform/acer-wmi/nitro_sense ]; then
  echo "nitro_sense: available"
else
  echo "nitro_sense: missing"
fi

echo
echo "Driver runtime configuration completed."
