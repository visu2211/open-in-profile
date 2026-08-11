const listEl = document.getElementById("list");
const statusEl = document.getElementById("status");

function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

async function main() {
  const { myProfileDir } = await chrome.storage.local.get("myProfileDir");

  chrome.runtime.sendMessage({ type: "getAllProfiles" }, (data) => {
    listEl.innerHTML = "";

    if (chrome.runtime.lastError || !data || !data.ok) {
      const msg = document.createElement("p");
      msg.className = "status";
      msg.textContent = (data && data.error) || "Companion helper not installed. Run host/install.sh, then reopen this page.";
      listEl.appendChild(msg);
      return;
    }

    if (!data.profiles || data.profiles.length === 0) {
      const msg = document.createElement("p");
      msg.className = "status";
      msg.textContent = "No Chrome profiles were detected on this machine.";
      listEl.appendChild(msg);
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

      const check = document.createElement("span");
      check.className = "check";
      check.textContent = "✓ This one";

      row.appendChild(avatar);
      row.appendChild(name);
      row.appendChild(check);

      row.addEventListener("click", async () => {
        await chrome.storage.local.set({ myProfileDir: p.dir });
        document.querySelectorAll(".row").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        statusEl.textContent = `Saved. "${p.name}" is now hidden from the list.`;
        statusEl.classList.add("saved");
      });

      listEl.appendChild(row);
    }
  });
}

main();
