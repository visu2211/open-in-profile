const listEl = document.getElementById("list");
const statusEl = document.getElementById("status");

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
  <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

function showStatus(text, saved) {
  statusEl.innerHTML = saved ? CHECK_SVG : "";
  const textNode = document.createElement("span");
  textNode.textContent = text;
  statusEl.appendChild(textNode);
  statusEl.classList.toggle("saved", !!saved);
  // restart the fade-in transition
  statusEl.classList.remove("visible");
  void statusEl.offsetWidth;
  statusEl.classList.add("visible");
}

async function main() {
  const { myProfileDir } = await chrome.storage.local.get("myProfileDir");

  chrome.runtime.sendMessage({ type: "getAllProfiles" }, (data) => {
    listEl.innerHTML = "";

    if (chrome.runtime.lastError || !data || !data.ok) {
      const div = document.createElement("div");
      div.className = "empty";
      div.textContent = (data && data.error) || "Companion helper not installed. Run host/install.sh, then reopen this page.";
      listEl.appendChild(div);
      return;
    }

    if (!data.profiles || data.profiles.length === 0) {
      const div = document.createElement("div");
      div.className = "empty";
      div.textContent = "No Chrome profiles were detected on this machine.";
      listEl.appendChild(div);
      return;
    }

    for (const p of data.profiles) {
      const row = document.createElement("div");
      row.className = "row" + (p.dir === myProfileDir ? " selected" : "");

      let avatar;
      if (p.avatar_b64) {
        avatar = document.createElement("img");
        avatar.className = "avatar";
        avatar.src = `data:${p.avatar_mime || "image/png"};base64,${p.avatar_b64}`;
        avatar.alt = "";
      } else {
        avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = initial(p.name);
      }

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = p.name;

      const radio = document.createElement("span");
      radio.className = "radio";

      row.appendChild(avatar);
      row.appendChild(name);
      row.appendChild(radio);

      row.addEventListener("click", async () => {
        await chrome.storage.local.set({ myProfileDir: p.dir });
        document.querySelectorAll(".row").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        showStatus(`"${p.name}" is now hidden from the list`, true);
      });

      listEl.appendChild(row);
    }
  });
}

main();
