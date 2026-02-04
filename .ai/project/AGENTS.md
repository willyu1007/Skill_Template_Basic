# AGENTS (Project Governance)

This file is the entry point for AI agents working with **project-level** governance in this repository.

## Quick start

1) Initialize the project hub (idempotent; creates `.ai/project/main/` from templates):
```bash
node .ai/scripts/projectctl.mjs init --project main
```

2) Run lint (CI-friendly; warnings do not fail the job):
```bash
node .ai/scripts/projectctl.mjs lint --check --project main
```

3) Sync/fix drift (manual):
```bash
node .ai/scripts/projectctl.mjs sync --apply --project main
```

## What to use when

### Use `project-orchestrator` when you:
- Start any new development request
- Need intake/triage/deduplication
- Need to map work to Milestones/Features/Requirements
- Need to decide whether to reuse an existing task or register a new one
- Need to update the project registry/changelog for continuity

### Use `project-sync-lint` when you:
- Need to validate the repo against the Project Contract
- Need to generate missing `.ai-task.yaml` files (IDs)
- Need to regenerate derived views (dashboard/task-index/feature-map)
- Need a CI gate to prevent project metadata drift

## Key principles
- Task execution progress is maintained in `dev-docs/**` (task bundle is the SoT for status).
- Task identity is anchored by `.ai-task.yaml` (`task_id`).
- Project semantic mapping lives in `.ai/project/main/registry.yaml`.
- Derived views are not authoritative; regenerate them instead of editing AUTO sections.

## Migration note
Missing `.ai-task.yaml` is allowed (warning) during migration, but any existing meta file must be valid, unique, and consistent with the registry.

## Contract
All behavior MUST follow `.ai/project/CONTRACT.md`.

