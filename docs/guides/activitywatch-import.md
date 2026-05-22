# ActivityWatch Import

RevPref can import ActivityWatch window-usage data to turn installed-app inventory into revealed-preference recommendations.

ActivityWatch events use:

- `timestamp` - ISO8601 event start time.
- `duration` - seconds spent in the event.
- `data.app` - active application name.
- `data.title` - active window title, which RevPref ignores.

RevPref only needs app-level aggregates. It does not store window titles in app records.

## Commands

Aggregate ActivityWatch usage summaries:

```bash
npm run import:activitywatch -- activitywatch-export.json --output usage.json
```

Merge usage into RevPref app records:

```bash
npm run import:activitywatch -- activitywatch-export.json \
  --apps windows-apps.json \
  --output windows-apps-with-usage.json
```

Print recommendations after merging:

```bash
npm run import:activitywatch -- activitywatch-export.json \
  --apps windows-apps.json \
  --recommend
```

## Supported Shapes

The importer accepts:

- A raw array of ActivityWatch events.
- An object with an `events` array.
- An exported bucket map under `buckets`.
- A top-level object where each value is a bucket with `events`.

By default, RevPref imports buckets that look like ActivityWatch's window watcher, such as `currentwindow` or `aw-watcher-window`. Use `--include-all-buckets` for unusual exports.

## Aggregates

For each app, RevPref computes:

- `lastForegroundAt` from the latest event end time.
- `foregroundSeconds30d` from event overlap with the last 30 days.
- `launchCount30d` as session-like clusters separated by more than five minutes.

The `--days` flag changes the foreground and launch-count window:

```bash
npm run import:activitywatch -- activitywatch-export.json --days 90 --output usage.json
```

## Privacy

RevPref ignores `data.title` and stores only app-level aggregates. ActivityWatch exports can contain sensitive window titles and URLs from other watchers, so keep raw exports local and avoid committing them.

## References

- ActivityWatch data model: https://docs.activitywatch.net/en/latest/buckets-and-events.html
- ActivityWatch data export examples: https://docs.activitywatch.net/en/latest/examples/working-with-data.html
