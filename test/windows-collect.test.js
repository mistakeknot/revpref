import assert from "node:assert/strict";
import test from "node:test";
import { buildWindowsCollectorArgs, getWindowsCollectorScriptPath } from "../src/collectors/windows/collect.js";
import { normalizeAppRecord } from "../src/core/model.js";

test("builds Windows collector command arguments", () => {
  const args = buildWindowsCollectorArgs({
    includeMsix: true,
    includeWinget: true
  });

  assert.deepEqual(args.slice(0, 4), ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File"]);
  assert.equal(args[4], getWindowsCollectorScriptPath());
  assert.ok(args.includes("-IncludeMsix"));
  assert.ok(args.includes("-IncludeWinget"));
});

test("keeps collector identifiers and metadata during normalization", () => {
  const normalized = normalizeAppRecord({
    id: "windows.registry.example",
    name: "Example App",
    identifiers: {
      registryKey: "{EXAMPLE}",
      wingetId: "Example.App"
    },
    metadata: {
      displayVersion: "1.2.3"
    }
  });

  assert.equal(normalized.identifiers.registryKey, "{EXAMPLE}");
  assert.equal(normalized.identifiers.wingetId, "Example.App");
  assert.equal(normalized.metadata.displayVersion, "1.2.3");
});
