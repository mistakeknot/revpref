# RevPref

RevPref is a local-first app hygiene assistant. It turns installed-app inventory and local usage signals into explainable recommendations for startup review, keep decisions, and uninstall handoff.

## Structure

- `src/core/` - App record model and recommendation scoring.
- `src/collectors/` - OS-specific inventory and usage collector sketches.
- `fixtures/` - Sample app records for CLI/demo runs.
- `test/` - Node test suite.
- `docs/` - Product, architecture, roadmap, persona, PRD, and CUJ docs.
- `.beads/` - Beads task tracking.
- `.clavain/` - Clavain project memory; `scratch/` is ignored.
- `.interwatch/` - Documentation drift watch configuration.

## Git Workflow

Trunk-based development. Work on `main` unless a task needs an isolated branch.

Before publishing or closing work:

```bash
npm test
bd ready
git status --short
```

## Working Style

Prefer small, testable changes. Keep the core recommendation engine deterministic and dependency-light. For OS collector work, preserve privacy boundaries and avoid destructive actions.

For irreversible actions such as deleting data, publishing releases, or changing repository visibility, ask first.

## See AGENTS.md For

Build/test instructions, coding conventions, Beads workflow, and operational notes.
