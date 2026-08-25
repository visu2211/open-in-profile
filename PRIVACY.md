# Privacy policy for Open Tab in Profile

Last updated: August 2026

Open Tab in Profile is a Chrome extension that sends the current tab, or several shift-selected tabs, to another Chrome profile or an Incognito window.

## What this extension does not do

- It does not collect, store, or transmit any personal data to any server.
- It does not use analytics, tracking, or advertising of any kind.
- It does not send any information over the network. The extension only talks to a small local helper program running on your own computer.

## What data the extension touches, and why

**Tab URLs.** When you choose a destination profile or Incognito, the extension reads the URL of the current tab (and any additional tabs you've shift-selected) so it can reopen those exact pages in the destination profile. These URLs are passed only to the local helper program on your machine, which opens them with Chrome's own `open` command. They are never sent anywhere else.

**Profile list.** The local helper reads Chrome's own profile list (profile names and, if available, the profile picture already cached by Chrome for a signed-in Google account) so the extension can show you which profiles you can send a tab to. This stays on your machine.

**Your own profile identity.** The extension uses `chrome.storage.local` to remember which installed profile is "you," so that profile can be left out of the destination list. This is stored locally in your browser profile and is never transmitted. As a fallback, before you set this manually, the extension may use `chrome.identity.getProfileUserInfo()` to check the signed-in Google account email of the current profile, purely to compare it against other profiles' account emails on your machine. This email is not stored or sent anywhere.

## Native messaging host

Because Chrome extensions cannot list or launch other Chrome profiles on their own, this extension communicates with a small open-source helper program (see the GitHub repository) installed separately by the user. All communication between the extension and the helper happens locally via Chrome's native messaging API and never leaves your computer.

## Changes to this policy

If this policy changes, the updated version will be posted at this same URL.

## Contact

Questions about this policy can be opened as an issue on the GitHub repository: https://github.com/visu2211/open-in-profile
