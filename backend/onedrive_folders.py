
"""Safe folder creation inside the configured OneDrive test folder."""

import os
from pathlib import Path


def create_test_folder(folder_name):
    root_text = os.environ.get("VIDEO_CONTENT_ONEDRIVE_TEST_DIR")

    if not root_text:
        raise ValueError("OneDrive test folder is not configured")

    root = Path(root_text).resolve(strict=True)

    if not root.is_dir():
        raise ValueError("OneDrive test location is not a folder")

    if not isinstance(folder_name, str):
        raise ValueError("Invalid folder name")

    name = folder_name.strip()

    if (
        not name
        or name in (".", "..")
        or len(name) > 100
        or name.endswith((".", " "))
        or any(char in name for char in '<>:"/\\|?*')
        or any(ord(char) < 32 for char in name)
        or name.split(".")[0].upper()
        in {"CON", "PRN", "AUX", "NUL",
            "COM1", "COM2", "COM3", "COM4",
            "COM5", "COM6", "COM7", "COM8", "COM9",
            "LPT1", "LPT2", "LPT3", "LPT4",
            "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"}
    ):
        raise ValueError("Folder name is not allowed")

    destination = root / name

    try:
        destination.mkdir(exist_ok=False)
    except FileExistsError:
        raise ValueError("Folder already exists")

    return destination.name
