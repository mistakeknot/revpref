# .clavain/

Agent memory filesystem. Created by `/clavain:init`.

- **learnings/** - Durable knowledge. Feeds review agents.
- **scratch/** - Ephemeral state (gitignored). Handoffs, checkpoints.
- **contracts/** - API contracts, invariants, SLOs. Read by correctness and safety review agents.

Extension points: `scenarios/`, `pipelines/`, `provenance/`