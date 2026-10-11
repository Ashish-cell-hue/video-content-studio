from pathlib import Path
from urllib.parse import unquote
import mimetypes
import os

# Allowed preview file types
ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp",
    ".mp4", ".txt", ".pdf"
}


def get_media_file(relative_path):
    """
    Return a validated media file path.
    Never allow access outside the configured media folder.
    """
    root_text = os.environ.get("VIDEO_CONTENT_MEDIA_DIR")

    if not root_text:
        raise RuntimeError(
            "VIDEO_CONTENT_MEDIA_DIR is not configured"
        )

    root = Path(root_text).resolve(strict=True)

    if not root.is_dir():
        raise ValueError("Media root is not a folder")

    if not isinstance(relative_path, str):
        raise ValueError("Invalid file path")

    # Reject null bytes and backslashes in incoming URLs.
    if "\x00" in relative_path or "\\" in relative_path:
        raise ValueError("Invalid file path")

    decoded = unquote(relative_path)

    if (
        "\x00" in decoded
        or "\\" in decoded
        or decoded.startswith("/")
    ):
        raise ValueError("Invalid file path")

    parts = decoded.split("/")

    if any(part in ("", ".", "..") for part in parts):
        raise ValueError("Invalid file path")

    file_path = root.joinpath(*parts).resolve()

    # Ensure the requested file remains inside the media root.
    if not file_path.is_relative_to(root):
        raise ValueError("Access outside media folder denied")

    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError("File type not allowed")

    if not file_path.is_file():
        raise FileNotFoundError("Media file not found")

    return file_path


def get_media_type(file_path):
    """Return a browser-friendly MIME type."""
    return mimetypes.guess_type(str(file_path))[0] or (
        "application/octet-stream"
    )
