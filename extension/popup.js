const listEl = document.getElementById("list");
const headerEl = document.getElementById("header");

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

function renderRow({ label, avatarText, incognito, onClick }) {
  const row = document.createElement("div");
  row.className = "row";
  const avatar = document.createElement("div");
  avatar.className = "avatar" + (incognito ? " incognito" : "");
  avatar.textContent = avatarText;
  const span = document.createElement("span");
  span.textContent = label;
  row.appendChild(avatar);
  row.appendChild(span);
  row.addEventListener("click", onClick);
  listEl.appendChild(row);
}

async function main() {
  const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
  const urls = tabs.map((t) => t.url).filter(Boolean);

  headerEl.textContent = urls.length > 1 ? `Send ${urls.length} tabs to…` : "Open tab in…";

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
        renderRow({
          label: p.name,
          avatarText: initial(p.name),
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
