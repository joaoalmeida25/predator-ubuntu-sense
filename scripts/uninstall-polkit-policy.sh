#!/usr/bin/env bash

set -euo pipefail

POLICY_TARGET="/usr/share/polkit-1/actions/com.predatorubuntu.sense.policy"

if [ -f "$POLICY_TARGET" ]; then
  echo "Removing Polkit policy..."
  sudo rm -f "$POLICY_TARGET"
  echo "Removed $POLICY_TARGET"
else
  echo "Polkit policy not found: $POLICY_TARGET"
fi

echo
echo "Polkit policy uninstall completed."
