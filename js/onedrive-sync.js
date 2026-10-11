
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
