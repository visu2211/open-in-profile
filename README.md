# Open Tab in Profile

A Chrome extension + local helper that sends the current tab (or every shift-selected tab) to another Chrome profile or an Incognito window.

## How it's triggered

Chrome doesn't let extensions hook into the native tab-strip right-click menu (the one with "New Tab to the Right," "Pin," etc.) or detect a mouse hover on the toolbar icon, so this uses the two things Chrome does allow:

- Toolbar icon click - opens a dropdown of your other profiles + Incognito. Shift-click multiple tabs in the tab strip first, then click the icon, and all of them get sent together.
- Right-click on a page - "Open tab in" submenu, same list, for the single tab you right-clicked.

## Why it needs a helper script

Extensions can't enumerate other Chrome profiles or launch them - that's blocked for privacy/security. host/open_in_profile_host.py runs locally (only Chrome can talk to it, never the network) and does those two things: reads Chrome's own profile list, and runs `open -na "Google Chrome" --args --profile-directory=... <urls>` to open the tabs there.

## Install (macOS)

1. Open chrome://extensions, turn on Developer mode (top right).
2. Click Load unpacked, select the extension folder in this repo.
3. Open Terminal and run:

   cd host
   ./install.sh

4. Fully quit Chrome (Cmd+Q) and reopen it so it picks up the new native messaging host.
5. Click the extension's toolbar icon on any tab - you should see your other profiles listed.

To remove everything later: cd host && ./uninstall.sh, then remove the extension from chrome://extensions.

## Known limitations

- Excluding your current profile from the list is best-effort: it only works if you're signed into that profile with a Google account, by matching it against your other profiles' signed-in accounts. If you use local (not signed-in) profiles, all profiles will show up in the list, including the one you're already on - clicking it just reopens the same tabs in a new window of the same profile, which is harmless but not useful.
- Profile names shown are whatever you've named them in Chrome's own profile settings.
- macOS only, since install.sh and the helper shell out to macOS's open command. A Windows version would use a PowerShell companion instead - ask if you want that built too.
