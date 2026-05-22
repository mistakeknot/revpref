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
  "startupEntries": [
    {
      "name": "Example App",
      "type": "run-key",
      "enabled": true
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

## Recommendation Safety

Set `isSystem` for operating-system components and drivers. Set `isUserProtected` when a user marks an app as "keep." Both should strongly suppress uninstall suggestions.
