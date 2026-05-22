#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { recommendApps } from "./core/recommend.js";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node src/cli.js <app-records.json>");
  process.exit(1);
}

const records = JSON.parse(await readFile(inputPath, "utf8"));
const recommendations = recommendApps(records);

if (recommendations.length === 0) {
  console.log("No cleanup recommendations yet.");
  process.exit(0);
}

for (const recommendation of recommendations) {
  console.log(`${recommendation.severity.toUpperCase()} ${recommendation.score} - ${recommendation.title}`);
  for (const reason of recommendation.reasons) {
    console.log(`  - ${reason}`);
  }
  console.log(`  Next: ${recommendation.nextStep}`);
  console.log("");
}
