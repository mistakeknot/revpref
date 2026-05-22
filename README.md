# RevPref

Revealed preferences for your apps.

RevPref is a local-first app hygiene assistant. It helps people see which applications they actually use, which ones sit in startup or background, and which ones may be worth uninstalling or disabling.

The project starts from one principle: your computer should not need a cloud account to tell you what is slowing it down.

## What It Does

- Tracks application usage over time.
- Builds a local inventory of installed apps.
- Flags rarely used startup apps.
- Explains why each recommendation exists.
- Never uninstalls anything automatically.
- Keeps usage data on the device by default.

## MVP Scope

This repository currently contains the first core prototype:

- A portable app usage/inventory record model.
- A recommendation scorer.
- A small CLI that reads app records from JSON.
- Fixtures and tests for recommendation behavior.
- Early collector sketches for Windows and macOS.

Run the prototype:

```bash
npm test
npm run recommend
```

## Task Tracking

RevPref uses [bd / Beads](https://github.com/steveyegge/beads) for local-first task tracking.

Useful commands:

```bash
bd ready
bd list
bd show <issue-id>
```

## Product Thesis

People are bad at remembering what they use. RevPref looks at revealed behavior instead:

- Apps you open often are probably valuable.
- Apps that start with the OS but never get foreground time are suspicious.
- Apps that consume disk, CPU, or network while rarely used deserve review.
- System apps and user-protected apps should be treated conservatively.

## Architecture Direction

RevPref is designed as three layers:

- **Collectors:** OS-specific code that reads app inventory, startup entries, usage events, and optional resource signals.
- **Core:** A local data model and recommendation engine that turns facts into explainable suggestions.
- **Shell:** A desktop UI for review, ignore/keep decisions, and guided uninstall handoff.

The first code here is shell-independent on purpose. The desktop shell can be Tauri, Electron, or native later without changing the core recommendation language.

## Privacy Defaults

- Local storage by default.
- No telemetry by default.
- No app/window titles sent anywhere.
- No uninstall without explicit user action.
- Every recommendation must include its evidence.

See [PRIVACY.md](PRIVACY.md).

## Related Projects

RevPref should learn from the ecosystem without copying incompatible code:

- ActivityWatch for local-first usage tracking ideas.
- Bulk Crap Uninstaller for Windows uninstall/inventory research.
- WinGet for Windows package identity and uninstall integration.
- osquery for cross-platform inventory table ideas.
- Pearcleaner for macOS app-cleanup research, with license caution.

See [docs/artifacts.md](docs/artifacts.md).

## License

MIT. See [LICENSE](LICENSE).
