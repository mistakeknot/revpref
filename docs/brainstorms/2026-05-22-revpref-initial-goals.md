# RevPref Initial Goals

Date: 2026-05-22

## Mission

Help people reclaim performance, attention, and disk space by showing which apps their behavior reveals they actually value.

## Near-Term Goals

- Make Windows inventory import real enough to run on a developer machine.
- Bootstrap usage history from ActivityWatch exports.
- Persist app records and user decisions locally.
- Shape a review UI that emphasizes evidence and user agency.
- Research a careful macOS collector strategy.

## Product Notes

- RevPref is not an automatic debloater.
- The first recommendation surface should include startup review, uninstall review, keep, ignore, and review-later.
- Every suggestion should expose the underlying evidence.
- System apps, drivers, and user-protected apps should be hard to recommend for removal.

## Open Questions

- Should ActivityWatch be an optional importer, a recommended companion, or a bundled integration?
- Which app identity keys are stable enough across Windows registry, WinGet, Store/MSIX, Steam, and macOS bundle IDs?
- How much resource usage can be collected locally without drifting into surveillance behavior?
- What is the minimal UI that earns trust before making any uninstall handoff?
