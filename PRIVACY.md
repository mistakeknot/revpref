# Privacy

RevPref deals with sensitive data: installed apps, foreground usage, startup items, and eventually resource usage. The default product posture is local-first and conservative.

## Defaults

- No cloud sync unless the user explicitly enables it.
- No telemetry unless the user explicitly enables it.
- No collection of document content.
- No collection of keystrokes.
- No collection of screenshots.
- No automatic uninstall actions.

## Sensitive Fields

Collectors should treat these as sensitive:

- Window titles.
- URLs and browser tabs.
- App launch history.
- Folder paths that include usernames or project names.
- Uninstall commands.
- Startup commands and launch agent arguments.

The core recommendation engine should not require raw window titles. It should prefer normalized app-level aggregates such as foreground seconds, launch count, last used date, startup status, and approximate disk size.

## Recommendation Rule

Every recommendation needs a visible explanation. A user should be able to answer: "Why is RevPref suggesting this?"

Examples:

- Unused for 97 days.
- Starts with Windows.
- Uses 3.4 GB on disk.
- Runs in the background but has little foreground usage.

## Non-Goals

RevPref is not spyware, employee monitoring software, parental control software, or an automatic debloater. It is a personal maintenance tool.
