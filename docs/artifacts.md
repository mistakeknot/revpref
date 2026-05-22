# Bootstrap Artifacts

RevPref should be its own open-source codebase, but several existing projects are useful reference points.

## ActivityWatch

- Site: https://activitywatch.net/
- Repo: https://github.com/ActivityWatch/activitywatch
- License: MPL-2.0
- Usefulness: local-first activity tracking, active-window watcher model, AFK watcher, event buckets, browser extension ideas.
- Caution: MPL is file-level copyleft. If code is reused, keep license obligations clear. For now, prefer interoperability and conceptual learning.

## Bulk Crap Uninstaller

- Repo: https://github.com/Klocman/Bulk-Crap-Uninstaller
- License: Apache-2.0
- Usefulness: Windows app inventory, uninstall systems, leftovers, Steam/Store app support, conservative cleanup workflows.
- Caution: RevPref should not start as a bulk uninstaller. It should recommend and hand off.

## WinGet

- Repo: https://github.com/microsoft/winget-cli
- License: MIT
- Usefulness: Windows package identity, installed package metadata, upgrade/uninstall pathways, user-visible package IDs.
- Caution: Do not rely on WinGet being complete. Many apps are registry/MSI-only.

## osquery

- Site: https://www.osquery.io/
- Repo: https://github.com/osquery/osquery
- Usefulness: cross-platform OS inventory model, startup item tables, process tables, launchd examples.
- Caution: Heavy dependency for a consumer app. Better as an optional advanced backend or prototyping reference.

## Pearcleaner

- Site: https://pearcleaner.com/
- Repo: https://github.com/alienator88/Pearcleaner
- License: Apache-2.0 with Commons Clause / fair-code, not OSI-style open source.
- Usefulness: macOS cleanup research, app bundles, containers, launch agents, Homebrew support.
- Caution: Do not copy code into RevPref if RevPref remains plain MIT/Apache open source.
