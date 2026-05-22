# RevPref Roadmap

## Phase 1: Core Prototype

- Keep the app-record model small and portable.
- Expand recommendation tests.
- Add persistence for user keep decisions.
- Improve CLI output and import ergonomics.

## Phase 2: Windows First

- Convert the PowerShell collector sketch into a supported read-only importer.
- Add package identity enrichment from WinGet where available.
- Detect startup entries with enough source detail to explain them.
- Run the importer against real local data and tune recommendation thresholds.

## Phase 3: Usage Bootstrap

- Add ActivityWatch import support.
- Normalize foreground app time, last-used date, and launch-ish activity.
- Document privacy expectations for imported data.

## Phase 4: Review UI

- Design the recommendation review flow.
- Add keep, ignore, and review-later decisions.
- Open official OS uninstall/startup controls rather than removing directly.

## Phase 5: macOS Path

- Research bundle scanning, receipts, Homebrew casks, Login Items, LaunchAgents, and LaunchDaemons.
- Define safe handoff behavior for macOS app removal.
- Build the minimum macOS inventory importer.

## Tracked In Beads

Run:

```bash
bd ready
bd children revpref-uzn
```
