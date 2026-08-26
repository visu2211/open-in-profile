#!/bin/bash
# Installs the "Open Tab in Profile" native messaging companion helper on macOS.
# Safe to re-run.

set -euo pipefail

# Both IDs are allowed so the same helper works whether you loaded the
# extension unpacked for local development (fixed via manifest.json's "key")
# or installed the published version from the Chrome Web Store (which gets
# its own permanent ID assigned on first upload).
DEV_EXTENSION_ID="ofloobakmehbbemacfiiljgofelkpfik"
STORE_EXTENSION_ID="ghlooolfgfmophmhdidhpdgdfemibaab"
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
    "chrome-extension://$DEV_EXTENSION_ID/",
    "chrome-extension://$STORE_EXTENSION_ID/"
  ]
}
EOF

echo ""
echo "Done. Now, in Chrome:"
echo "  1. Go to chrome://extensions"
echo "  2. Turn on 'Developer mode' (top right)"
echo "  3. Click 'Load unpacked' and select the 'extension' folder (only needed for local dev -- skip if you installed from the Chrome Web Store)"
echo "  4. Quit and reopen Chrome fully (Cmd+Q, then relaunch) so it picks up the new native host"
echo ""
echo "This helper now accepts connections from either:"
echo "  Local dev build:        $DEV_EXTENSION_ID"
echo "  Chrome Web Store build: $STORE_EXTENSION_ID"
echo "If chrome://extensions shows a different ID than both of these, native messaging will still be blocked -- let me know the ID it shows and I'll add it.
