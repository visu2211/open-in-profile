// Open Tab in Profile - background service worker
// Talks to the local native-messaging helper (host/open_in_profile_host.py)
// to list installed Chrome profiles and to actually launch tabs in them,
// since extensions cannot do either of those things on their own.

const HOST_NAME = "com.openinprofile.host";

let cachedProfiles = null; // [{dir, name, email}]
let currentEmail = null;

async function fetchProfiles() {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(
      HOST_NAME,
      { action: "list_profiles" },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          resolve({ ok: false, error: chrome.runtime.lastError?.message || response?.error || "Companion helper not found. Run host/install.sh first." });
          return;
        }
        resolve({ ok: true, profiles: response.profiles || [] });
      }
    );
  });
}

async function fetchCurrentEmail() {
  try {
    if (!chrome.identity || !chrome.identity.getProfileUserInfo) return null;
    const info = await chrome.identity.getProfileUserInfo({ accountStatus: "ANY" });
    return info && info.email ? info.email : null;
  } catch (e) {
    return null;
  }
}

async function refreshData(force = false) {
  if (!cachedProfiles || force) {
    const result = await fetchProfiles();
    cachedProfiles = result;
  }
  if (currentEmail === null) {
    currentEmail = (await fetchCurrentEmail()) || "";
  }
  return { profiles: cachedProfiles, currentEmail };
}

function visibleProfiles(profiles, currentEmail) {
  if (!profiles || !profiles.ok) return [];
  if (!currentEmail) return profiles.profiles; // can't tell which one is "us" - show all
  return profiles.profiles.filter((p) => (p.email || "").toLowerCase() !== currentEmail.toLowerCase());
}

async function rebuildContextMenu() {
  const { profiles, currentEmail: email } = await refreshData();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "open-tab-in-root",
      title: "Open tab in",
      contexts: ["page"],
    });

    const list = visibleProfiles(profiles, email);
    if (profiles && profiles.ok && list.length > 0) {
      for (const p of list) {
        chrome.contextMenus.create({
          id: `profile:${p.dir}`,
          parentId: "open-tab-in-root",
          title: p.name,
          contexts: ["page"],
        });
      }
      chrome.contextMenus.create({
        id: "sep",
        parentId: "open-tab-in-root",
        type: "separator",
        contexts: ["page"],
      });
    } else {
      chrome.contextMenus.create({
        id: "profile:__none__",
        parentId: "open-tab-in-root",
        title: profiles && profiles.ok ? "No other profiles found" : "Companion helper not installed",
        enabled: false,
        contexts: ["page"],
      });
      chrome.contextMenus.create({
        id: "sep",
        parentId: "open-tab-in-root",
        type: "separator",
        contexts: ["page"],
      });
    }

    chrome.contextMenus.create({
      id: "profile:__incognito__",
      parentId: "open-tab-in-root",
      title: "Incognito window",
      contexts: ["page"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => rebuildContextMenu());
chrome.runtime.onStartup.addListener(() => rebuildContextMenu());

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId.toString().startsWith("profile:")) return;
  const key = info.menuItemId.toString().slice("profile:".length);
  const url = info.pageUrl || (tab && tab.url) || "";
  if (!url || key === "__none__") return;
  if (key === "__incognito__") {
    sendToProfile([url], { incognito: true });
  } else {
    sendToProfile([url], { dir: key });
  }
});

function sendToProfile(urls, target) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(
      HOST_NAME,
      {
        action: "open_tabs",
        profile: target.dir || null,
        incognito: !!target.incognito,
        urls,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: true });
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "getData") {
    (async () => {
      const { profiles, currentEmail: email } = await refreshData(true);
      sendResponse({
        ok: !!(profiles && profiles.ok),
        error: profiles && !profiles.ok ? profiles.error : null,
        profiles: visibleProfiles(profiles, email),
      });
      rebuildContextMenu();
    })();
    return true; // async
  }

  if (message?.type === "sendTabs") {
    (async () => {
      const result = await sendToProfile(message.urls, message.target);
      sendResponse(result);
    })();
    return true; // async
  }
});
