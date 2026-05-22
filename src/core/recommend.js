import { ACTION, SEVERITY, daysSince, formatBytes, hasEnabledStartup, normalizeAppRecord } from "./model.js";

const GIB = 1024 ** 3;
const HOUR = 60 * 60;

export function recommendApps(records, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  return records
    .map((record) => recommendApp(record, { now }))
    .filter((recommendation) => recommendation.action !== ACTION.KEEP)
    .sort((a, b) => b.score - a.score || a.appName.localeCompare(b.appName));
}

export function recommendApp(record, options = {}) {
  const app = normalizeAppRecord(record);
  const now = options.now ?? new Date();
  const reasons = [];
  let score = 0;

  if (app.isSystem) {
    return keep(app, "System app or OS component.");
  }

  if (app.isUserProtected) {
    return keep(app, "Marked as keep by the user.");
  }

  const unusedDays = daysSince(app.usage.lastForegroundAt, now);
  const startup = hasEnabledStartup(app);

  if (unusedDays === null && app.usage.launchCount30d === 0 && app.usage.foregroundSeconds30d === 0) {
    score += 45;
    reasons.push("No recorded foreground use.");
  } else if (unusedDays !== null && unusedDays >= 90) {
    score += 42;
    reasons.push(`Not used for ${unusedDays} days.`);
  } else if (unusedDays !== null && unusedDays >= 60) {
    score += 32;
    reasons.push(`Not used for ${unusedDays} days.`);
  } else if (unusedDays !== null && unusedDays >= 30) {
    score += 18;
    reasons.push(`Not used for ${unusedDays} days.`);
  }

  if (app.usage.foregroundSeconds30d < 10 * 60 && app.usage.launchCount30d <= 1) {
    score += 10;
    reasons.push("Very little foreground use in the last 30 days.");
  }

  if (startup) {
    score += app.usage.foregroundSeconds30d < HOUR ? 20 : 8;
    reasons.push("Starts with the operating system.");
  }

  if (app.sizeBytes >= 20 * GIB) {
    score += 20;
    reasons.push(`Uses ${formatBytes(app.sizeBytes)} on disk.`);
  } else if (app.sizeBytes >= 5 * GIB) {
    score += 12;
    reasons.push(`Uses ${formatBytes(app.sizeBytes)} on disk.`);
  } else if (app.sizeBytes >= 1 * GIB) {
    score += 6;
    reasons.push(`Uses ${formatBytes(app.sizeBytes)} on disk.`);
  }

  if (app.usage.backgroundSeconds30d >= 4 * HOUR && app.usage.foregroundSeconds30d < HOUR) {
    score += 12;
    reasons.push("Runs in the background more than it is used in the foreground.");
  }

  if (app.usage.foregroundSeconds30d >= 10 * HOUR || app.usage.launchCount30d >= 10) {
    score -= 35;
    reasons.push("Recent usage is high, so uninstall confidence is reduced.");
  }

  if (score >= 55) {
    return buildRecommendation(app, ACTION.REVIEW_UNINSTALL, SEVERITY.HIGH, score, reasons);
  }

  if (startup && score >= 25) {
    return buildRecommendation(app, ACTION.REVIEW_STARTUP, SEVERITY.MEDIUM, score, reasons);
  }

  if (score >= 35) {
    return buildRecommendation(app, ACTION.REVIEW_UNINSTALL, SEVERITY.MEDIUM, score, reasons);
  }

  return keep(app, "No strong cleanup signal.");
}

function buildRecommendation(app, action, severity, score, reasons) {
  const actionText = action === ACTION.REVIEW_STARTUP ? "Review startup behavior" : "Review for uninstall";
  return {
    id: `${app.id}:${action}`,
    appId: app.id,
    appName: app.name,
    action,
    severity,
    score,
    title: `${actionText}: ${app.name}`,
    reasons,
    nextStep: action === ACTION.REVIEW_STARTUP
      ? "Consider disabling startup first. Keep the app installed if you still use it."
      : "Open the official uninstall flow only after confirming you do not need this app."
  };
}

function keep(app, reason) {
  return {
    id: `${app.id}:${ACTION.KEEP}`,
    appId: app.id,
    appName: app.name,
    action: ACTION.KEEP,
    severity: SEVERITY.INFO,
    score: 0,
    title: `Keep: ${app.name}`,
    reasons: [reason],
    nextStep: "No action suggested."
  };
}
