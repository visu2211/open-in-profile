#!/bin/bash
# Installs the "Open Tab in Profile" native messaging companion helper on macOS.
# Safe to re-run.

set -euo pipefail

EXTENSION_ID="ofloobakmehbbemacfiiljgofelkpfik"
HOST_NAME="com.openinprofile.host"

INSTALL_DIR="$HOME/Library/Application Support/OpenInProfileHelper"
NMH_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing helper to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp "$SCRIPT_DIR/open_in_profile_host.py" "$INSTALL_DIR/open_in_profile_host.py"
chmod +x "$INSTALL_DIR/open_in_profile_host.py"

echo "Registering native messaging host with Chrome..."
mkdir -p "$NMH_DIR"

cat > "$NMH_DIR/$HOST_NAME.json" <<EOF
{
  "name": "$HOST_NAME",
  "description": "Open Tab in Profile companion helper",
  "path": "$INSTALL_DIR/open_in_profile_host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo ""
echo "Done. Now, in Chrome:"
echo "  1. Go to chrome://extensions"
echo "  2. Turn on 'Developer mode' (top right)"
echo "  3. Click 'Load unpacked' and select the 'extension' folder"
echo "  4. Quit and reopen Chrome fully (Cmd+Q, then relaunch) so it picks up the new native host"
echo ""
echo "Extension ID should be: $EXTENSION_ID"
echo "If chrome://extensions shows a different ID for it, the manifest.json key didn't take -- reload the extension and check for errors."
