
/* Video Content Studio — OneDrive Test Folder Creation */

(() => {
  "use strict";

  const API_URL =
    "http://127.0.0.1:8001/api/onedrive/create-folder";

  function initializeOneDriveSync() {
    if (document.getElementById("onedriveFolderButton")) return;

    const button = document.createElement("button");
    button.id = "onedriveFolderButton";
    button.type = "button";
    button.textContent = "☁ + New OneDrive Folder";

    Object.assign(button.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "9000",
      padding: "13px 20px",
      borderRadius: "12px",
      border: "1px solid #63d5f2",
      background: "#13233d",
      color: "#ffffff",
      cursor: "pointer",
      boxShadow: "0 8px 30px rgba(0,0,0,0.35)"
    });

    button.addEventListener("click", async () => {
      const name = window.prompt(
        "OneDrive Test Folder mein naye folder ka naam likhein:"
      );

      if (name === null) return;

      const folderName = name.trim();

      if (!folderName) {
        window.alert("Folder name empty nahi ho sakta.");
        return;
      }

      const confirmed = window.confirm(
        "Kya aap OneDrive test folder ke andar '" +
        folderName +
        "' banana chahte hain?"
      );

      if (!confirmed) return;

      button.disabled = true;
      button.textContent = "Creating...";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: folderName })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Folder create nahi ho paaya."
          );
        }

        window.alert(
          "Folder successfully created: " + result.folder +
          "\nOneDrive sync hone mein thoda waqt lag sakta hai."
        );

      } catch (error) {
        window.alert(
          "OneDrive folder error: " + error.message
        );
      } finally {
        button.disabled = false;
        button.textContent = "☁ + New OneDrive Folder";
      }
    });

    document.body.appendChild(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeOneDriveSync
    );
  } else {
    initializeOneDriveSync();
  }
})();

/* OneDrive Folder List — Read Only */

document.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement("section");
  panel.id = "onedriveFoldersPanel";

  Object.assign(panel.style, {
    position: "fixed",
    right: "24px",
    bottom: "85px",
    zIndex: "8999",
    width: "300px",
    maxHeight: "320px",
    overflowY: "auto",
    padding: "16px",
    border: "1px solid rgba(99,213,242,0.4)",
    borderRadius: "14px",
    background: "#13233d",
    color: "#ffffff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)"
  });

  const heading = document.createElement("h3");
  heading.textContent = "☁ OneDrive Folders";
  heading.style.margin = "0 0 12px";

  const list = document.createElement("div");
  list.textContent = "Loading folders...";

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.textContent = "↻ Refresh Folders";
  refreshButton.style.marginBottom = "12px";

  async function loadFolders() {
    list.textContent = "Loading folders...";

    try {
      const response = await fetch(
        "http://127.0.0.1:8001/api/onedrive/folders",
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("API " + response.status);

      const folders = await response.json();
      list.replaceChildren();

      if (folders.length === 0) {
        list.textContent = "No folders found.";
        return;
      }

      for (const folder of folders) {
        const item = document.createElement("div");
        item.textContent = "📁 " + folder.name;
        item.style.padding = "7px 0";
        item.style.overflowWrap = "anywhere";
        list.appendChild(item);
      }

    } catch (error) {
      list.textContent = "Folders load nahi ho paaye: " + error.message;
    }
  }

  refreshButton.addEventListener("click", loadFolders);

  panel.append(heading, refreshButton, list);
  document.body.appendChild(panel);

  loadFolders();
});
