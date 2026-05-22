# Windows Inventory Collector

RevPref's Windows collector is read-only. It emits normalized app records that can be reviewed directly or passed into the recommendation engine.

## Commands

Collect registry-installed apps:

```bash
npm run collect:windows -- --output windows-apps.json
```

Collect and print recommendations:

```bash
npm run collect:windows -- --recommend
```

Include optional metadata:

```bash
npm run collect:windows -- --include-winget --output windows-apps.json
npm run collect:windows -- --include-msix --output windows-apps.json
```

Flags can be combined:

```bash
npm run collect:windows -- --include-winget --include-msix --output windows-apps.json
```

## Sources

The collector currently reads:

- Registry uninstall keys from HKLM and HKCU.
- Registry startup entries from Run and RunOnce keys.
- User and machine Startup folders.
- Optional MSIX/AppX packages via `Get-AppxPackage`.
- Optional WinGet package IDs by parsing `winget list` table output.

## Output

Each app record includes:

- Stable `id`.
- `name`, `vendor`, `installPath`, and `sizeBytes` where available.
- `identifiers` such as registry key, registry view, scope, WinGet ID, or package family.
- `startupEntries` matched by install path, app name, or registry key.
- `uninstall` handoff command where available.
- Conservative `isSystem` flags for registry entries that look like OS components or no-remove entries.

## Recommendation Caveat

Inventory alone does not prove an app is unused. Without imported usage history, RevPref treats startup apps as startup-review candidates rather than uninstall candidates. Importing ActivityWatch data is the planned next step for real revealed-preference scoring.
