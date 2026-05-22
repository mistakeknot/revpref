# RevPref PRD

## Problem

Desktop users accumulate apps, launchers, helpers, sync clients, and background utilities over years. Existing uninstallers show installed programs, but rarely answer the more human question: "Do I actually use this?"

## Goals

- Inventory installed apps and startup entries.
- Import or collect local usage aggregates.
- Produce explainable cleanup recommendations.
- Preserve user agency with keep/ignore decisions.
- Avoid telemetry and automatic uninstall behavior.

## Non-Goals

- Automatic app removal.
- Employee monitoring.
- Browser-history analysis by default.
- Cloud accounts or telemetry in the MVP.

## MVP Features

### F1: Windows Inventory Importer

Read registry uninstall keys, startup commands, and optional package identity sources into normalized app records.

### F2: ActivityWatch Import

Import app-level local usage aggregates from ActivityWatch data or exports.

### F3: Local Persistence

Save app records, recommendation history, and user keep/ignore decisions.

### F4: Recommendation Review UI

Display ranked recommendations with reasons, severity, score, and next-step handoff.

### F5: macOS Collector Research

Validate app bundle, Login Item, LaunchAgent, receipt, and Homebrew cask paths.

## Safety Requirements

- Never uninstall automatically.
- Suppress system apps by default.
- Show evidence for every recommendation.
- Let users mark apps as keep.
- Keep raw sensitive data local.

## Success Signals

- A user can identify at least three candidate startup/uninstall reviews in under five minutes.
- Tests cover recommendation scoring behavior.
- App records remain portable JSON.
- The Windows importer can be run read-only on a real machine.
