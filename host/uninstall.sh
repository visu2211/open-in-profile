#!/bin/bash
# Removes the "Open Tab in Profile" companion helper and its Chrome registration.

set -euo pipefail

HOST_NAME="com.openinprofile.host"
INSTALL_DIR="$HOME/Library/Application Support/OpenInProfileHelper"
NMH_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

rm -f "$NMH_DIR/$HOST_NAME.json"
rm -rf "$INSTALL_DIR"

echo "Removed the companion helper and its Chrome registration."
echo "Remove the extension itself from chrome://extensions if you no longer want it."
