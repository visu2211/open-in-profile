#!/bin/bash
# Installs the "Open Tab in Profile" native messaging companion helper on macOS.
# Safe to re-run.
#
# The helper is packaged as a small app bundle (OpenInProfileHelper.app) rather
# than a bare script. Since macOS 26/27, Chrome's data folder is covered by
# Apple's Application Support protection (silent deny, no prompt) and Chrome
# launches native hosts with TCC responsibility disclaimed, so a plain
# `python3 script.py` fails with EPERM. A bundle with a stable bundle ID gives
# the user something to grant Full Disk Access to, and the grant is inherited
# by the Python child the launcher spawns.
#
# Requires the Xcode Command Line Tools (`xcode-select --install`) for `cc`.

set -euo pipefail

# Both IDs are allowed so the same helper works whether you loaded the
# extension unpacked for local development (fixed via manifest.json's "key")
# or installed the published version from the Chrome Web Store (which gets
# its own permanent ID assigned on first upload).
DEV_EXTENSION_ID="ofloobakmehbbemacfiiljgofelkpfik"
STORE_EXTENSION_ID="ghlooolfgfmophmhdidhpdgdfemibaab"
HOST_NAME="com.openinprofile.host"
BUNDLE_ID="com.openinprofile.helper"

INSTALL_DIR="$HOME/Library/Application Support/OpenInProfileHelper"
APP_DIR="$INSTALL_DIR/OpenInProfileHelper.app"
NMH_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v cc >/dev/null 2>&1; then
  echo "error: the C compiler 'cc' was not found. Install the Xcode Command Line Tools first:" >&2
  echo "  xcode-select --install" >&2
  exit 1
fi

# /usr/bin/cc is an xcrun shim. If xcode-select points at an Xcode that is
# missing, stale, or built for a different macOS, the shim fails even though
# `command -v cc` succeeds. Fall back to the Command Line Tools for this build.
if ! cc --version >/dev/null 2>&1 && [[ -d /Library/Developer/CommandLineTools ]]; then
  echo "note: 'cc' via xcode-select is not working; building with the Command Line Tools instead"
  export DEVELOPER_DIR=/Library/Developer/CommandLineTools
fi

echo "Building helper bundle in: $APP_DIR"
rm -rf "$APP_DIR"
# Clean up the pre-bundle layout from older installs.
rm -f "$INSTALL_DIR/open_in_profile_host.py"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

cc -O2 -Wall -o "$APP_DIR/Contents/MacOS/OpenInProfileHelper" "$SCRIPT_DIR/launcher.c"
cp "$SCRIPT_DIR/Info.plist" "$APP_DIR/Contents/Info.plist"
cp "$SCRIPT_DIR/open_in_profile_host.py" "$APP_DIR/Contents/Resources/open_in_profile_host.py"
chmod +x "$APP_DIR/Contents/Resources/open_in_profile_host.py"

# Ad-hoc signature with a stable identifier so TCC can remember the grant.
codesign --force --sign - --identifier "$BUNDLE_ID" "$APP_DIR"

echo "Registering native messaging host with Chrome..."
mkdir -p "$NMH_DIR"

cat > "$NMH_DIR/$HOST_NAME.json" <<EOF
{
  "name": "$HOST_NAME",
  "description": "Open Tab in Profile companion helper",
  "path": "$APP_DIR/Contents/MacOS/OpenInProfileHelper",
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
echo "  5. On macOS 26 or newer, grant the helper Full Disk Access once (macOS will NOT prompt):"
echo "     System Settings > Privacy & Security > Full Disk Access > '+' > select"
echo "     $APP_DIR"
echo "     (opening that pane and a Finder window at the app for you now)"
echo ""

if [[ "$(sw_vers -productVersion | cut -d. -f1)" -ge 26 ]]; then
  open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles" 2>/dev/null || true
  open -R "$APP_DIR" 2>/dev/null || true
fi

echo ""
echo "This helper now accepts connections from either:"
echo "  Local dev build:        $DEV_EXTENSION_ID"
echo "  Chrome Web Store build: $STORE_EXTENSION_ID"
echo "If chrome://extensions shows a different ID than both of these, native messaging will still be blocked -- let me know the ID it shows and I'll add it."
