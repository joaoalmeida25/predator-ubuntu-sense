#!/usr/bin/env bash

set -euo pipefail

RULE_TARGET="/etc/polkit-1/rules.d/49-predator-ubuntu-sense.rules"

echo "Removing Predator Ubuntu Sense passwordless Polkit rule..."

if [ -f "$RULE_TARGET" ]; then
  sudo rm -f "$RULE_TARGET"
  echo "Removed $RULE_TARGET"
else
  echo "$RULE_TARGET not found"
fi

echo
echo "Restarting Polkit service..."
sudo systemctl restart polkit.service 2>/dev/null || sudo systemctl restart polkit 2>/dev/null || true

echo
echo "Passwordless Polkit rule removed."
echo "Note: user group membership is not removed automatically."
