#!/usr/bin/env python3
"""
Native messaging host for the "Open Tab in Profile" Chrome extension (macOS).

Chrome extensions cannot enumerate other Chrome profiles or launch them
directly -- that's blocked for privacy/security reasons. This small helper
runs locally (spawned by Chrome itself over stdin/stdout, never network-
reachable) and does the two things the extension can't:

  1. list_profiles - reads Chrome's own "Local State" file to report the
     profiles installed on this machine.
  2. open_tabs     - shells out to `open -na "Google Chrome" --args ...`
     to actually launch tabs in a different profile or Incognito.

Native messaging wire format: each message is a 4-byte little-endian
length prefix followed by that many bytes of UTF-8 JSON, in both
directions. See:
https://developer.chrome.com/docs/apps/nativeMessaging/
"""

import json
import os
import struct
import subprocess
import sys

CHROME_USER_DATA_DIR = os.path.expanduser(
    "~/Library/Application Support/Google/Chrome"
)
LOCAL_STATE_PATH = os.path.join(CHROME_USER_DATA_DIR, "Local State")


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        return None  # Chrome closed the pipe
    message_length = struct.unpack("<I", raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)


def send_message(obj):
    encoded = json.dumps(obj).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def list_profiles():
    if not os.path.exists(LOCAL_STATE_PATH):
        return {"ok": False, "error": "Couldn't find Chrome's Local State file. Is Chrome installed at the default location?"}

    try:
        with open(LOCAL_STATE_PATH, "r", encoding="utf-8") as f:
            state = json.load(f)
    except Exception as e:
        return {"ok": False, "error": f"Couldn't read Chrome's Local State file: {e}"}

    info_cache = state.get("profile", {}).get("info_cache", {})
    profiles = []
    for dir_name, info in info_cache.items():
        name = info.get("shortcut_name") or info.get("name") or dir_name
        email = info.get("user_name") or ""
        profiles.append({"dir": dir_name, "name": name, "email": email})

    profiles.sort(key=lambda p: p["name"].lower())
    return {"ok": True, "profiles": profiles}


def open_tabs(profile, incognito, urls):
    urls = [u for u in (urls or []) if u]
    if not urls:
        return {"ok": False, "error": "No URLs given."}

    args = ["open", "-na", "Google Chrome", "--args"]
    if incognito:
        args.append("--incognito")
    elif profile:
        args.append(f"--profile-directory={profile}")
    else:
        return {"ok": False, "error": "No target profile or incognito flag given."}

    args.extend(urls)

    try:
        subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        return {"ok": False, "error": str(e)}

    return {"ok": True}


def main():
    while True:
        try:
            message = read_message()
        except Exception as e:
            send_message({"ok": False, "error": f"Malformed message: {e}"})
            return

        if message is None:
            return  # stdin closed, Chrome ended the connection

        action = message.get("action")
        if action == "list_profiles":
            send_message(list_profiles())
        elif action == "open_tabs":
            send_message(open_tabs(message.get("profile"), message.get("incognito"), message.get("urls")))
        else:
            send_message({"ok": False, "error": f"Unknown action: {action}"})


if __name__ == "__main__":
    main()
