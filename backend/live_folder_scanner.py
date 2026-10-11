
"""Read OneDrive media folder structure without changing any files."""

import os
from pathlib import Path

SYSTEM_FILES = {".ds_store", "desktop.ini", "thumbs.db"}


def scan_live_folders():
    root_text = os.environ.get("VIDEO_CONTENT_LIVE_MEDIA_DIR")

    if not root_text:
        raise ValueError("Live media folder is not configured")

    root = Path(root_text).resolve(strict=True)

    if not root.is_dir():
        raise ValueError("Live media location is not a folder")

    rows = []

    for current_folder, directories, filenames in os.walk(root):
        current = Path(current_folder)

        # Do not follow folder shortcuts or symlinks.
        directories[:] = sorted(
            name for name in directories
            if not (current / name).is_symlink()
        )

        for name in directories:
            folder = current / name
            relative_path = folder.relative_to(root).as_posix()

            rows.append({
                "Relative Path": relative_path,
                "Item Type": "Folder",
                "Extension": "",
                "Category": "Folder"
            })

        for name in sorted(filenames):
            if name.lower() in SYSTEM_FILES:
                continue

            file_path = current / name

            if file_path.is_symlink():
                continue

            relative_path = file_path.relative_to(root).as_posix()
            extension = file_path.suffix.lower()

            rows.append({
                "Relative Path": relative_path,
                "Item Type": "File",
                "Extension": extension,
                "Category": extension.lstrip(".").upper() or "Other"
            })

    return rows
