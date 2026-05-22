# RevPref Conventions

Canonical documentation paths. Do not introduce compatibility aliases or fallback filenames.

## Documentation Paths

- Roadmap: `docs/roadmap.md`
- Vision: `docs/revpref-vision.md`
- PRD: `docs/PRD.md`
- CUJs: `docs/cujs/*.md`
- Personas: `docs/canon/personas.md`
- Architecture: `docs/architecture.md`
- App record model: `docs/app-record.md`

## Code Paths

- Core model and scoring: `src/core/`
- OS collectors: `src/collectors/<platform>/`
- CLI entrypoints: `src/cli.js`
- Fixtures: `fixtures/`
- Tests: `test/`

## Naming

- Product name: `RevPref`
- Package/repo slug: `revpref`
- npm package name: `revpref-app`
- Beads issue prefix: `revpref`

## Enforcement Rules

- Do not use non-canonical documentation paths.
- New docs, commands, and scripts must reference canonical paths only.
- Keep local/private runtime files out of git, especially Beads credentials and `.clavain/scratch/`.
- Recommendation changes need tests.
