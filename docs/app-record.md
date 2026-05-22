# App Record Model

The current prototype uses plain JSON records.

```json
{
  "id": "example.vendor.product",
  "name": "Example App",
  "platform": "windows",
  "source": "registry",
  "vendor": "Example Inc.",
  "installPath": "C:/Program Files/Example",
  "installedAt": "2025-11-01T00:00:00.000Z",
  "sizeBytes": 2147483648,
  "isSystem": false,
  "isUserProtected": false,
  "identifiers": {
    "registryKey": "Example",
    "wingetId": "Example.ExampleApp",
    "packageFamilyName": null
  },
  "startupEntries": [
    {
      "name": "Example App",
      "type": "run-key",
      "enabled": true,
      "source": "HKCU:/Software/Microsoft/Windows/CurrentVersion/Run",
      "command": "C:/Program Files/Example/example.exe"
    }
  ],
  "usage": {
    "lastForegroundAt": "2026-01-01T00:00:00.000Z",
    "foregroundSeconds30d": 120,
    "launchCount30d": 1,
    "backgroundSeconds30d": 7200
  },
  "resourceUsage": {
    "uploadBytes7d": 0,
    "downloadBytes7d": 0
  },
  "uninstall": {
    "kind": "handoff",
    "command": "example-uninstaller.exe"
  },
  "metadata": {
    "displayVersion": "1.2.3"
  }
}
```

## Identity

Stable app identity is hard. The MVP uses `id`, but real collectors should preserve multiple identifiers:

- Bundle ID.
- MSI product code.
- Registry key path.
- WinGet package ID.
- App Store ID.
- Install path.
- Executable path.

## Collector Commands

Windows inventory can be collected with:

```bash
npm run collect:windows -- --output windows-apps.json
```

Optional flags:

- `--include-msix` includes MSIX/AppX packages.
- `--include-winget` tries to enrich records with WinGet package IDs.
- `--recommend` prints recommendations directly instead of JSON records.

ActivityWatch usage can be merged into app records with:

```bash
npm run import:activitywatch -- activitywatch-export.json --apps windows-apps.json --output windows-apps-with-usage.json
```

## Recommendation Safety

Set `isSystem` for operating-system components and drivers. Set `isUserProtected` when a user marks an app as "keep." Both should strongly suppress uninstall suggestions.
