# RevPref Philosophy

## Design Principles

- **Revealed behavior over stated intent.** Recommendations should come from what people actually use, not what they remember using.
- **Local first by default.** App inventory and usage history are sensitive. The product should work without telemetry, cloud sync, or an account.
- **Explain every suggestion.** A recommendation without evidence is just a hunch with UI.
- **Recommend, never surprise.** RevPref should guide users to official uninstall or startup controls; it should not remove apps automatically.
- **Conservative around system software.** Drivers, OS components, security tools, and user-protected apps should be suppressed unless there is explicit, safe review context.
- **Start useful before getting clever.** Simple scoring, clear data, and good explanations beat opaque heuristics.

## Key Goals

- Build a Windows installed-app inventory importer.
- Add ActivityWatch import support to bootstrap real usage data.
- Persist app records and user keep/ignore decisions locally.
- Design the first recommendation review UI shell.
- Research the macOS collector path for app bundles, startup items, and safe uninstall handoff.

## Tradeoffs

Explicit bets we're making:

- The first version can be a CLI/core prototype before a desktop UI exists.
- The core should stay portable even if the eventual shell changes.
- ActivityWatch import is a faster path to useful historical usage than native foreground tracking on day one.
- Recommendations should bias toward review/disable guidance before uninstall guidance.
