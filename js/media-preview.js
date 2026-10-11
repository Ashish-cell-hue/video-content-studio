
/* Video Content Studio — Universal Media Preview */

function openMediaPreview(filePath) {
  const extension = filePath.split(".").pop().toLowerCase();

  const supported = [
    "png", "jpg", "jpeg", "webp",
    "mp4", "txt", "pdf"
  ];

  if (!supported.includes(extension)) return;

  const mediaUrl =
    "http://127.0.0.1:8001/api/media?path=" +
    encodeURIComponent(filePath);

  // Remove an earlier preview if it exists.
  document.getElementById("mediaPreviewOverlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "mediaPreviewOverlay";
  overlay.className = "media-preview-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "File preview");

  const panel = document.createElement("div");
  panel.className = "media-preview-panel";

  const header = document.createElement("div");
  header.className = "media-preview-header";

  const title = document.createElement("strong");
  title.textContent = filePath.split("/").pop();

  const close = document.createElement("button");
  close.type = "button";
  close.className = "media-preview-close";
  close.textContent = "✕ Close";

  const content = document.createElement("div");
  content.className = "media-preview-content";

  function closePreview() {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") closePreview();
  }

  close.addEventListener("click", closePreview);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closePreview();
  });

  document.addEventListener("keydown", onKeyDown);

  if (["png", "jpg", "jpeg", "webp"].includes(extension)) {
    const image = document.createElement("img");
    image.src = mediaUrl;
    image.alt = title.textContent;
    image.className = "media-preview-image";
    image.onerror = () => {
      content.textContent = "Image load nahi ho paayi.";
    };
    content.appendChild(image);

  } else if (extension === "mp4") {
    const video = document.createElement("video");
    video.src = mediaUrl;
    video.controls = true;
    video.preload = "metadata";
    video.className = "media-preview-video";
    content.appendChild(video);

  } else if (extension === "pdf") {
    const frame = document.createElement("iframe");
    frame.src = mediaUrl;
    frame.title = title.textContent;
    frame.className = "media-preview-frame";
    content.appendChild(frame);

  } else if (extension === "txt") {
    const textBox = document.createElement("pre");
    textBox.className = "media-preview-text";
    textBox.textContent = "Script loading...";
    content.appendChild(textBox);

    fetch(mediaUrl)
      .then(response => {
        if (!response.ok) throw new Error("File unavailable");
        return response.text();
      })
      .then(text => {
        if (overlay.isConnected) textBox.textContent = text;
      })
      .catch(() => {
        if (overlay.isConnected) {
          textBox.textContent = "Script load nahi ho paayi.";
        }
      });
  }

  header.append(title, close);
  panel.append(header, content);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  close.focus();
}
