#!/usr/bin/env zsh

# Read-only macOS inventory sketch for RevPref.
# Scans common application folders and emits approximate app records.

set -euo pipefail

python3 - <<'PY'
import json
import os
import plistlib
from pathlib import Path

roots = [
    Path("/Applications"),
    Path("/System/Applications"),
    Path.home() / "Applications",
]

def dir_size(path):
    total = 0
    for root, _, files in os.walk(path):
        for name in files:
            try:
                total += (Path(root) / name).stat().st_size
            except OSError:
                pass
    return total

records = []
for root in roots:
    if not root.exists():
        continue
    for app in root.glob("*.app"):
        info = app / "Contents" / "Info.plist"
        bundle_id = app.stem.lower().replace(" ", ".")
        name = app.stem
        vendor = None
        if info.exists():
            try:
                with info.open("rb") as handle:
                    plist = plistlib.load(handle)
                bundle_id = plist.get("CFBundleIdentifier", bundle_id)
                name = plist.get("CFBundleDisplayName") or plist.get("CFBundleName") or name
                vendor = plist.get("NSHumanReadableCopyright")
            except Exception:
                pass

        records.append({
            "id": bundle_id,
            "name": name,
            "platform": "macos",
            "source": "bundle",
            "vendor": vendor,
            "installPath": str(app),
            "installedAt": None,
            "sizeBytes": dir_size(app),
            "isSystem": str(app).startswith("/System/"),
            "isUserProtected": False,
            "startupEntries": [],
            "usage": {
                "lastForegroundAt": None,
                "foregroundSeconds30d": 0,
                "launchCount30d": 0,
                "backgroundSeconds30d": 0,
            },
            "uninstall": {
                "kind": "trash-handoff",
                "command": None,
            },
        })

print(json.dumps(records, indent=2))
PY
