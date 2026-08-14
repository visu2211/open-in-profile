const listEl = document.getElementById("list");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const settingsLink = document.getElementById("settings-link");

const INCOGNITO_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 13l1.8-5.4A2 2 0 016.7 6h10.6a2 2 0 011.9 1.6L21 13" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="6.5" cy="15.5" r="2.5" stroke="white" stroke-width="1.6"/>
  <circle cx="17.5" cy="15.5" r="2.5" stroke="white" stroke-width="1.6"/>
  <path d="M9 15.5h6" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

settingsLink.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

function renderError(message) {
  listEl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = message;
  listEl.appendChild(div);
}

function renderRow({ label, avatarText, avatarSrc, incognito, onClick }) {
  const row = document.createElement("div");
  row.className = "row";

  let avatar;
  if (avatarSrc) {
    avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = avatarSrc;
    avatar.alt = "";
  } else {
    avatar = document.createElement("div");
    avatar.className = "avatar" + (incognito ? " incognito" : "");
    if (incognito) {
      avatar.innerHTML = INCOGNITO_SVG;
    } else {
      avatar.textContent = avatarText;
    }
  }

  const span = document.createElement("span");
  span.className = "row-label";
  span.textContent = label;
  row.appendChild(avatar);
  row.appendChild(span);
  row.addEventListener("click", onClick);
  listEl.appendChild(row);
}

async function main() {
  const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
  const urls = tabs.map((t) => t.url).filter(Boolean);

  if (urls.length > 1) {
    subtitleEl.textContent = `${urls.length} tabs selected`;
  } else {
    subtitleEl.textContent = "";
  }

  chrome.runtime.sendMessage({ type: "getData" }, (data) => {
    listEl.innerHTML = "";

    if (chrome.runtime.lastError) {
      renderError("Couldn't reach the extension background. Try reopening this popup.");
      return;
    }

    if (!data.ok) {
      renderError(data.error || "Companion helper not installed. See README to run host/install.sh, then reload this extension.");
    } else if (!data.profiles || data.profiles.length === 0) {
      renderError("No other Chrome profiles found on this machine.");
    } else {
      for (const p of data.profiles) {
        const avatarSrc = p.avatar_b64 ? `data:${p.avatar_mime || "image/png"};base64,${p.avatar_b64}` : null;
        renderRow({
          label: p.name,
          avatarText: initial(p.name),
          avatarSrc,
          onClick: () => sendAndClose({ dir: p.dir }, urls),
        });
      }
      const sep = document.createElement("div");
      sep.className = "sep";
      listEl.appendChild(sep);
    }

    renderRow({
      label: "Incognito window",
      avatarText: "I",
      incognito: true,
      onClick: () => sendAndClose({ incognito: true }, urls),
    });
  });
}

function sendAndClose(target, urls) {
  if (urls.length === 0) return;
  chrome.runtime.sendMessage({ type: "sendTabs", target, urls }, () => {
    window.close();
  });
}

main();
