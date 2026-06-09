#!/usr/bin/env bash

set -euo pipefail

POLICY_SOURCE="packaging/polkit/com.predatorubuntu.sense.policy"
POLICY_TARGET="/usr/share/polkit-1/actions/com.predatorubuntu.sense.policy"

if [ ! -f "$POLICY_SOURCE" ]; then
  echo "Policy file not found: $POLICY_SOURCE"
  exit 1
fi

echo "Installing Polkit policy..."
sudo install -Dm644 "$POLICY_SOURCE" "$POLICY_TARGET"

echo "Installed:"
ls -l "$POLICY_TARGET"

echo
echo "Polkit policy installation completed."
