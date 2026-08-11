# Open Tab in Profile

A Chrome extension + local helper that sends the current tab (or every shift-selected tab) to another Chrome profile or an Incognito window.

## How it's triggered

Chrome doesn't let extensions hook into the native tab-strip right-click menu (the one with "New Tab to the Right," "Pin," etc.) or detect a mouse hover on the toolbar icon, so this uses the two things Chrome does allow:

- Toolbar icon click - opens a dropdown of your other profiles + Incognito. Shift-click multiple tabs in the tab strip first, then click the icon, and all of them get sent together.
- Right-click on a page - "Open tab in" submenu, same list, for the single tab you right-clicked.

## Why it needs a helper script

Extensions can't enumerate other Chrome profiles or launch them - that's blocked for privacy/security. host/open_in_profile_host.py runs locally (only Chrome can talk to it, never the network) and does those things: reads Chrome's own profile list (including each profile's Google account picture, if it has one), and runs `open -na "Google Chrome" --args --profile-directory=... <urls>` to open the tabs there.

## Install (macOS)

1. Open chrome://extensions, turn on Developer mode (top right).
2. Click Load unpacked, select the extension folder in this repo.
3. Open Terminal and run:

   cd host
   ./install.sh

4. Fully quit Chrome (Cmd+Q) and reopen it so it picks up the new native messaging host.
5. Click the extension's toolbar icon on any tab - you should see your other profiles listed.

To remove everything later: `cd host && ./uninstall.sh`, then remove the extension from chrome://extensions.

## Settings

Click "Settings" at the bottom of the popup (or right-click the toolbar icon and choose Options) to tell the extension which profile is "you." That profile then gets left out of the list, since sending a tab to your own current profile doesn't do anything useful. Without this, the extension falls back to a best-effort guess based on your signed-in Google account, which only works if that profile is actually signed in.

The popup and settings page also follow your system's light/dark mode automatically.

## Known limitations

- Real profile avatars only show up for profiles signed into a Google account with a profile picture; local (not signed-in) profiles fall back to a colored initial.
- Profile names shown are whatever you've named them in Chrome's own profile settings.
- macOS only, since install.sh and the helper shell out to macOS's open command. A Windows version would use a PowerShell companion instead - ask if you want that built too.
