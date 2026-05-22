export const ACTION = Object.freeze({
  REVIEW_UNINSTALL: "review_uninstall",
  REVIEW_STARTUP: "review_startup",
  KEEP: "keep"
});

export const SEVERITY = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info"
});

export function normalizeAppRecord(record) {
  if (!record || typeof record !== "object") {
    throw new TypeError("Expected an app record object.");
  }

  if (!record.id || !record.name) {
    throw new Error("App records require both id and name.");
  }

  return {
    id: record.id,
    name: record.name,
    platform: record.platform ?? "unknown",
    source: record.source ?? "unknown",
    vendor: record.vendor ?? null,
    installPath: record.installPath ?? null,
    installedAt: record.installedAt ?? null,
    sizeBytes: Number.isFinite(record.sizeBytes) ? record.sizeBytes : 0,
    isSystem: Boolean(record.isSystem),
    isUserProtected: Boolean(record.isUserProtected),
    identifiers: normalizeObject(record.identifiers),
    startupEntries: Array.isArray(record.startupEntries) ? record.startupEntries : [],
    usage: {
      lastForegroundAt: record.usage?.lastForegroundAt ?? null,
      foregroundSeconds30d: finiteNumber(record.usage?.foregroundSeconds30d),
      launchCount30d: finiteNumber(record.usage?.launchCount30d),
      backgroundSeconds30d: finiteNumber(record.usage?.backgroundSeconds30d)
    },
    resourceUsage: {
      uploadBytes7d: finiteNumber(record.resourceUsage?.uploadBytes7d),
      downloadBytes7d: finiteNumber(record.resourceUsage?.downloadBytes7d)
    },
    uninstall: record.uninstall ?? null,
    metadata: normalizeObject(record.metadata)
  };
}

export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) {
    return null;
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "unknown size";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

export function hasEnabledStartup(app) {
  return app.startupEntries.some((entry) => entry.enabled !== false);
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
