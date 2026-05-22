# RevPref - Agent Development Guide

## Overview

RevPref is a local-first app hygiene assistant. It turns installed-app inventory and local usage signals into explainable recommendations for startup review, keep decisions, and uninstall handoff.

## Agent Quickstart

1. Read this file.
2. Run `bd ready` to see available work.
3. Keep recommendation changes covered by tests.
4. Run `npm test` before publishing.
5. When done, update/close the relevant bead, commit, and push.

## Directory Layout

| Path | Purpose |
| --- | --- |
| `src/core/` | App record model and recommendation engine |
| `src/collectors/` | OS-specific collector sketches and importers |
| `fixtures/` | Sample app records |
| `test/` | Node test suite |
| `docs/` | Product, architecture, roadmap, PRD, and personas |
| `.beads/` | Beads task tracking |
| `.clavain/` | Clavain memory; `scratch/` is ignored |
| `.interwatch/` | Documentation drift watch config |

## Build & Test

```bash
npm test
npm run recommend
```

## Coding Conventions

- Use plain JavaScript modules for the prototype.
- Keep core scoring deterministic and dependency-light.
- App records should remain portable JSON.
- Recommendation behavior changes need tests.
- Avoid raw surveillance data in the core model; prefer aggregates.
- Never implement automatic uninstall behavior.

## Bead Tracking

This project uses **bd (Beads)** for issue tracking.

```bash
bd ready
bd list
bd show <issue-id>
bd create "Title" --type task --priority 2
bd close <issue-id>
bd dolt push
```

Run `bd prime` for workflow context.

## Key Dependencies

- Node.js 20+
- npm
- bd / Beads
- Dolt for Beads storage
