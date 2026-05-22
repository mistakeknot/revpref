import assert from "node:assert/strict";
import test from "node:test";
import { ACTION } from "../src/core/model.js";
import { recommendApp, recommendApps } from "../src/core/recommend.js";

const now = new Date("2026-05-22T12:00:00.000Z");

test("recommends uninstall review for old, large, unused apps", () => {
  const recommendation = recommendApp({
    id: "example.large",
    name: "Example Large App",
    sizeBytes: 25 * 1024 ** 3,
    startupEntries: [],
    usage: {
      lastForegroundAt: "2025-12-01T00:00:00.000Z",
      foregroundSeconds30d: 0,
      launchCount30d: 0,
      backgroundSeconds30d: 0
    }
  }, { now });

  assert.equal(recommendation.action, ACTION.REVIEW_UNINSTALL);
  assert.equal(recommendation.severity, "high");
  assert.ok(recommendation.reasons.some((reason) => reason.includes("Not used")));
  assert.ok(recommendation.reasons.some((reason) => reason.includes("GiB")));
});

test("recommends startup review before uninstall for low-use startup apps", () => {
  const recommendation = recommendApp({
    id: "example.startup",
    name: "Example Startup App",
    sizeBytes: 200 * 1024 ** 2,
    startupEntries: [{ name: "Example Startup App", enabled: true }],
    usage: {
      lastForegroundAt: "2026-04-20T00:00:00.000Z",
      foregroundSeconds30d: 120,
      launchCount30d: 1,
      backgroundSeconds30d: 0
    }
  }, { now });

  assert.equal(recommendation.action, ACTION.REVIEW_STARTUP);
  assert.ok(recommendation.reasons.includes("Starts with the operating system."));
});

test("does not recommend system apps", () => {
  const recommendation = recommendApp({
    id: "system.app",
    name: "System App",
    isSystem: true,
    startupEntries: [{ name: "System App", enabled: true }],
    usage: {
      lastForegroundAt: null,
      foregroundSeconds30d: 0,
      launchCount30d: 0,
      backgroundSeconds30d: 0
    }
  }, { now });

  assert.equal(recommendation.action, ACTION.KEEP);
});

test("treats unknown usage on startup apps as startup review first", () => {
  const recommendation = recommendApp({
    id: "unknown.startup",
    name: "Unknown Startup App",
    sizeBytes: 0,
    startupEntries: [{ name: "Unknown Startup App", enabled: true }],
    usage: {
      lastForegroundAt: null,
      foregroundSeconds30d: 0,
      launchCount30d: 0,
      backgroundSeconds30d: 0
    }
  }, { now });

  assert.equal(recommendation.action, ACTION.REVIEW_STARTUP);
  assert.ok(recommendation.reasons.includes("No usage history available."));
});

test("discounts frequently used apps even if they start with the OS", () => {
  const recommendation = recommendApp({
    id: "daily.chat",
    name: "Daily Chat",
    sizeBytes: 900 * 1024 ** 2,
    startupEntries: [{ name: "Daily Chat", enabled: true }],
    usage: {
      lastForegroundAt: "2026-05-22T00:00:00.000Z",
      foregroundSeconds30d: 80 * 60 * 60,
      launchCount30d: 25,
      backgroundSeconds30d: 120 * 60 * 60
    }
  }, { now });

  assert.equal(recommendation.action, ACTION.KEEP);
});

test("sorts recommendations by score descending", () => {
  const recommendations = recommendApps([
    {
      id: "medium",
      name: "Medium App",
      sizeBytes: 0,
      startupEntries: [{ name: "Medium App", enabled: true }],
      usage: {
        lastForegroundAt: "2026-04-01T00:00:00.000Z",
        foregroundSeconds30d: 0,
        launchCount30d: 0,
        backgroundSeconds30d: 0
      }
    },
    {
      id: "high",
      name: "High App",
      sizeBytes: 30 * 1024 ** 3,
      startupEntries: [{ name: "High App", enabled: true }],
      usage: {
        lastForegroundAt: "2025-01-01T00:00:00.000Z",
        foregroundSeconds30d: 0,
        launchCount30d: 0,
        backgroundSeconds30d: 8 * 60 * 60
      }
    }
  ], { now });

  assert.equal(recommendations[0].appId, "high");
  assert.equal(recommendations[1].appId, "medium");
}
);
