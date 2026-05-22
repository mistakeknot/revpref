#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { collectWindowsInventory } from "./collectors/windows/collect.js";
import { recommendApps } from "./core/recommend.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(1);
}

if (args[0] === "collect") {
  await runCollect(args.slice(1));
} else {
  const inputPath = args[0] === "recommend" ? args[1] : args[0];
  if (!inputPath) {
    printUsage();
    process.exit(1);
  }

  const records = JSON.parse(await readFile(inputPath, "utf8"));
  printRecommendations(recommendApps(records));
}

async function runCollect(args) {
  const platform = args[0];
  if (platform !== "windows") {
    console.error("Only `collect windows` is implemented.");
    process.exit(1);
  }

  const options = parseCollectWindowsArgs(args.slice(1));
  const records = await collectWindowsInventory(options);

  if (options.recommend) {
    printRecommendations(recommendApps(records));
    return;
  }

  const json = `${JSON.stringify(records, null, 2)}\n`;
  if (options.outputPath) {
    await writeFile(options.outputPath, json);
    console.error(`Wrote ${records.length} app records to ${options.outputPath}`);
  } else {
    process.stdout.write(json);
  }
}

function parseCollectWindowsArgs(args) {
  const options = {
    includeMsix: false,
    includeWinget: false,
    outputPath: null,
    recommend: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--include-msix") {
      options.includeMsix = true;
    } else if (arg === "--include-winget") {
      options.includeWinget = true;
    } else if (arg === "--recommend") {
      options.recommend = true;
    } else if (arg === "--output" || arg === "-o") {
      options.outputPath = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown collect windows option: ${arg}`);
    }
  }

  if (options.outputPath === undefined) {
    throw new Error("Missing path after --output.");
  }

  return options;
}

function printRecommendations(recommendations) {
  if (recommendations.length === 0) {
    console.log("No cleanup recommendations yet.");
    return;
  }

  for (const recommendation of recommendations) {
    console.log(`${recommendation.severity.toUpperCase()} ${recommendation.score} - ${recommendation.title}`);
    for (const reason of recommendation.reasons) {
      console.log(`  - ${reason}`);
    }
    console.log(`  Next: ${recommendation.nextStep}`);
    console.log("");
  }
}

function printUsage() {
  console.error(`Usage:
  node src/cli.js recommend <app-records.json>
  node src/cli.js <app-records.json>
  node src/cli.js collect windows [--include-msix] [--include-winget] [--output records.json] [--recommend]`);
}
