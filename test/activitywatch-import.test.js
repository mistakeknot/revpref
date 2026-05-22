import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { aggregateActivityWatchUsage, extractActivityWatchEvents, mergeActivityWatchUsage, normalizeUsageName } from "../src/importers/activitywatch.js";

const now = "2026-05-22T12:00:00.000Z";

test("extracts current-window ActivityWatch events from exported buckets", async () => {
  const exportData = JSON.parse(await readFile("fixtures/sample-activitywatch-export.json", "utf8"));
  const events = extractActivityWatchEvents(exportData);

  assert.equal(events.length, 4);
  assert.ok(events.every((event) => event.data.app));
});

test("aggregates foreground seconds, sessions, and last foreground timestamp", async () => {
  const exportData = JSON.parse(await readFile("fixtures/sample-activitywatch-export.json", "utf8"));
  const summaries = aggregateActivityWatchUsage(exportData, { now, days: 30 });
  const discord = summaries.find((summary) => summary.normalizedName === "discord");
  const ea = summaries.find((summary) => summary.normalizedName === "ea app");

  assert.equal(discord.foregroundSeconds30d, 2700);
  assert.equal(discord.launchCount30d, 2);
  assert.equal(discord.lastForegroundAt, "2026-05-22T11:00:00.000Z");
  assert.equal(ea.foregroundSeconds30d, 0);
  assert.equal(ea.launchCount30d, 0);
  assert.equal(ea.lastForegroundAt, "2026-03-01T12:10:00.000Z");
});

test("merges ActivityWatch usage into app records by normalized app name", async () => {
  const exportData = JSON.parse(await readFile("fixtures/sample-activitywatch-export.json", "utf8"));
  const appRecords = JSON.parse(await readFile("fixtures/sample-apps.json", "utf8"));
  const result = mergeActivityWatchUsage(appRecords, exportData, { now, days: 30 });
  const discord = result.records.find((record) => record.name === "Discord");
  const editor = result.records.find((record) => record.name === "Big Video Editor");

  assert.equal(result.matchedApps, 3);
  assert.equal(discord.usage.foregroundSeconds30d, 2700);
  assert.equal(discord.usage.launchCount30d, 2);
  assert.equal(discord.metadata.activityWatchApp, "Discord");
  assert.equal(editor.usage.foregroundSeconds30d, 3600);
});

test("normalizes common executable and version-like app names", () => {
  assert.equal(normalizeUsageName("Discord.exe"), "discord");
  assert.equal(normalizeUsageName("Logi Tune 3.2.247"), "logi tune");
  assert.equal(normalizeUsageName("Notepad++ (64-bit x64)"), "notepad");
});
