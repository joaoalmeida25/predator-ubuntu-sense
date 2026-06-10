#!/usr/bin/env bash

set -euo pipefail

GROUP_NAME="predator-sense"
RULE_TARGET="/etc/polkit-1/rules.d/49-predator-ubuntu-sense.rules"
TARGET_USER="${SUDO_USER:-$USER}"

echo "Installing Predator Ubuntu Sense passwordless Polkit rule..."

if ! getent group "$GROUP_NAME" >/dev/null 2>&1; then
  echo "Creating group: $GROUP_NAME"
  sudo groupadd --system "$GROUP_NAME"
else
  echo "Group already exists: $GROUP_NAME"
fi

echo "Adding user '$TARGET_USER' to group '$GROUP_NAME'..."
sudo usermod -aG "$GROUP_NAME" "$TARGET_USER"

echo "Writing Polkit rule to $RULE_TARGET..."
sudo tee "$RULE_TARGET" >/dev/null <<'RULE'
polkit.addRule(function(action, subject) {
  if (
    action.id == "com.predatorubuntu.sense.helper" &&
    subject.local &&
    subject.active &&
    subject.isInGroup("predator-sense")
  ) {
    return polkit.Result.YES;
  }
});
RULE

sudo chmod 0644 "$RULE_TARGET"
sudo chown root:root "$RULE_TARGET"

echo
echo "Installed:"
sudo ls -l "$RULE_TARGET"

echo
echo "Restarting Polkit service..."
sudo systemctl restart polkit.service 2>/dev/null || sudo systemctl restart polkit 2>/dev/null || true

echo
echo "Passwordless Polkit rule installed."
echo
echo "IMPORTANT:"
echo "You must log out and log in again for the new group membership to apply to desktop apps."
echo "For terminal-only testing, you can run: newgrp $GROUP_NAME"
