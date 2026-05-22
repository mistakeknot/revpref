const DEFAULT_DAYS = 30;
const DEFAULT_SESSION_GAP_SECONDS = 5 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function extractActivityWatchEvents(input, options = {}) {
  const includeAllBuckets = Boolean(options.includeAllBuckets);

  if (Array.isArray(input)) {
    return input.filter(isActivityWatchEvent).map(normalizeEvent);
  }

  if (!input || typeof input !== "object") {
    throw new TypeError("Expected ActivityWatch export data.");
  }

  if (Array.isArray(input.events)) {
    return input.events.filter(isActivityWatchEvent).map(normalizeEvent);
  }

  const buckets = findBuckets(input);
  const events = [];
  for (const bucket of buckets) {
    if (!includeAllBuckets && !isWindowBucket(bucket)) {
      continue;
    }

    const bucketEvents = Array.isArray(bucket.events) ? bucket.events : [];
    for (const event of bucketEvents) {
      if (isActivityWatchEvent(event)) {
        events.push(normalizeEvent(event));
      }
    }
  }

  return events;
}

export function aggregateActivityWatchUsage(input, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const days = Number.isFinite(options.days) ? options.days : DEFAULT_DAYS;
  const cutoff = new Date(now.getTime() - days * DAY_MS);
  const sessionGapSeconds = Number.isFinite(options.sessionGapSeconds)
    ? options.sessionGapSeconds
    : DEFAULT_SESSION_GAP_SECONDS;
  const grouped = new Map();

  for (const event of extractActivityWatchEvents(input, options)) {
    const appName = getEventAppName(event);
    if (!appName) {
      continue;
    }

    const start = new Date(event.timestamp);
    if (Number.isNaN(start.getTime())) {
      continue;
    }

    const durationSeconds = Math.max(0, Number(event.duration) || 0);
    if (durationSeconds <= 0) {
      continue;
    }

    const end = new Date(start.getTime() + durationSeconds * 1000);
    const key = normalizeUsageName(appName);
    if (!key) {
      continue;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        appName,
        normalizedName: key,
        foregroundSeconds30d: 0,
        launchCount30d: 0,
        lastForegroundAt: null,
        eventCount: 0,
        _events30d: []
      });
    }

    const summary = grouped.get(key);
    summary.eventCount += 1;
    if (!summary.lastForegroundAt || end > new Date(summary.lastForegroundAt)) {
      summary.lastForegroundAt = end.toISOString();
      summary.appName = appName;
    }

    const overlapSeconds = getOverlapSeconds(start, end, cutoff, now);
    if (overlapSeconds > 0) {
      summary.foregroundSeconds30d += overlapSeconds;
      summary._events30d.push({ start, end });
    }
  }

  return [...grouped.values()]
    .map((summary) => finalizeSummary(summary, sessionGapSeconds))
    .sort((a, b) => b.foregroundSeconds30d - a.foregroundSeconds30d || a.appName.localeCompare(b.appName));
}

export function mergeActivityWatchUsage(appRecords, activityWatchInput, options = {}) {
  const summaries = Array.isArray(activityWatchInput) && activityWatchInput.every(isUsageSummary)
    ? activityWatchInput
    : aggregateActivityWatchUsage(activityWatchInput, options);
  const usageByKey = new Map(summaries.map((summary) => [summary.normalizedName, summary]));
  const aliases = normalizeAliases(options.aliases ?? {});
  const matchedKeys = new Set();
  let matchedRecords = 0;

  const records = appRecords.map((record) => {
    const match = findUsageMatch(record, usageByKey, aliases);
    if (!match) {
      return record;
    }

    matchedRecords += 1;
    matchedKeys.add(match.normalizedName);

    return {
      ...record,
      usage: {
        ...(record.usage ?? {}),
        lastForegroundAt: laterIso(record.usage?.lastForegroundAt, match.lastForegroundAt),
        foregroundSeconds30d: Math.round(match.foregroundSeconds30d),
        launchCount30d: match.launchCount30d,
        backgroundSeconds30d: record.usage?.backgroundSeconds30d ?? 0
      },
      metadata: {
        ...(record.metadata ?? {}),
        activityWatchApp: match.appName,
        activityWatchEventCount: match.eventCount
      }
    };
  });

  return {
    records,
    summaries,
    matchedRecords,
    matchedApps: matchedKeys.size,
    unmatchedSummaries: summaries.filter((summary) => !matchedKeys.has(summary.normalizedName))
  };
}

export function normalizeUsageName(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .toLowerCase()
    .replace(/\.(exe|app)$/u, "")
    .replace(/\b(x64|x86|64-bit|32-bit)\b/gu, "")
    .replace(/\bversion\s+\d+(\.\d+)*\b/gu, "")
    .replace(/\s+\d+(\.\d+){1,4}\b/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function findBuckets(input) {
  if (input.buckets && typeof input.buckets === "object") {
    return Object.entries(input.buckets).map(([id, bucket]) => ({ id, ...bucket }));
  }

  return Object.entries(input)
    .filter(([, value]) => value && typeof value === "object" && Array.isArray(value.events))
    .map(([id, bucket]) => ({ id, ...bucket }));
}

function isWindowBucket(bucket) {
  const haystack = [
    bucket.id,
    bucket.type,
    bucket.client,
    bucket.name
  ].filter(Boolean).join(" ").toLowerCase();

  return haystack.includes("currentwindow") || haystack.includes("aw-watcher-window") || haystack.includes("watcher-window");
}

function isActivityWatchEvent(event) {
  return Boolean(event && typeof event === "object" && event.timestamp && event.data && typeof event.data === "object");
}

function normalizeEvent(event) {
  return {
    timestamp: event.timestamp,
    duration: Number(event.duration) || 0,
    data: event.data
  };
}

function getEventAppName(event) {
  return typeof event.data.app === "string" ? event.data.app.trim() : "";
}

function getOverlapSeconds(start, end, cutoff, now) {
  const overlapStart = Math.max(start.getTime(), cutoff.getTime());
  const overlapEnd = Math.min(end.getTime(), now.getTime());
  return Math.max(0, (overlapEnd - overlapStart) / 1000);
}

function finalizeSummary(summary, sessionGapSeconds) {
  const sorted = summary._events30d.sort((a, b) => a.start - b.start);
  let launchCount30d = 0;
  let previousEnd = null;

  for (const event of sorted) {
    if (!previousEnd || (event.start - previousEnd) / 1000 > sessionGapSeconds) {
      launchCount30d += 1;
    }

    if (!previousEnd || event.end > previousEnd) {
      previousEnd = event.end;
    }
  }

  const { _events30d, ...publicSummary } = summary;
  return {
    ...publicSummary,
    foregroundSeconds30d: Math.round(publicSummary.foregroundSeconds30d),
    launchCount30d
  };
}

function isUsageSummary(value) {
  return value && typeof value === "object" && typeof value.normalizedName === "string";
}

function normalizeAliases(aliases) {
  const normalized = new Map();
  for (const [recordName, usageNames] of Object.entries(aliases)) {
    normalized.set(
      normalizeUsageName(recordName),
      new Set([usageNames].flat().map(normalizeUsageName).filter(Boolean))
    );
  }
  return normalized;
}

function findUsageMatch(record, usageByKey, aliases) {
  const recordKeys = getRecordMatchKeys(record);
  for (const key of recordKeys) {
    const direct = usageByKey.get(key);
    if (direct) {
      return direct;
    }

    const aliasKeys = aliases.get(key);
    if (!aliasKeys) {
      continue;
    }

    for (const aliasKey of aliasKeys) {
      const aliasMatch = usageByKey.get(aliasKey);
      if (aliasMatch) {
        return aliasMatch;
      }
    }
  }

  return null;
}

function getRecordMatchKeys(record) {
  const candidates = [
    record.name,
    record.identifiers?.wingetId?.split(".").at(-1),
    record.identifiers?.registryKey,
    record.identifiers?.packageName,
    record.identifiers?.packageFamilyName,
    basenameWithoutExtension(record.installPath)
  ];

  return [...new Set(candidates.map(normalizeUsageName).filter(Boolean))];
}

function basenameWithoutExtension(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  const normalized = path.replace(/\\/gu, "/").split("/").filter(Boolean).at(-1) ?? "";
  return normalized.replace(/\.(exe|app)$/iu, "");
}

function laterIso(a, b) {
  if (!a) {
    return b ?? null;
  }

  if (!b) {
    return a;
  }

  return new Date(a) > new Date(b) ? a : b;
}
