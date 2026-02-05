---
name: project-sync-lint
description: Project hub synchronizer and validator. Use to scan the entire repo (including multiple dev-docs roots), validate the repo against .ai/project/CONTRACT.md, lint project/task metadata, and fix drift by generating missing task identity meta (.ai-task.yaml) and regenerating derived views under .ai/project/<project>/. Suitable for CI gate (check-only) and manual repair (apply). Keywords: sync, lint, validate, writeback, registry, dashboard, changelog, derived views.
---

# Project Sync/Lint

## Purpose
Provide **centralized** synchronization and validation for the project governance system:
- Lint: enforce the Project Contract and detect drift
- Sync: generate missing `.ai-task.yaml` (IDs), upsert `registry.yaml`, and regenerate derived views
- CI: run in check-only mode to block inconsistent changes (errors only; warnings do not fail by default)

This skill is **repo governance oriented**. It should not implement product code changes.

## Commands
All commands are implemented by:
- `node .ai/scripts/projectctl.mjs`

### Init
Create `.ai/project/<project>/` files from templates (idempotent).

```bash
node .ai/scripts/projectctl.mjs init --project main
```

### Lint (check-only)
Scan all configured or discovered `dev-docs` roots and validate the repo against the contract.

```bash
node .ai/scripts/projectctl.mjs lint --check --project main
```

### Sync (dry-run or apply)
Generate missing task identity meta, upsert registry tasks, and regenerate derived views.

```bash
node .ai/scripts/projectctl.mjs sync --dry-run --project main
node .ai/scripts/projectctl.mjs sync --apply --project main
```

Optional: append sync-detected events to the hub changelog (append-only; apply-mode only):
```bash
node .ai/scripts/projectctl.mjs sync --apply --project main --changelog
```

## Contract highlights (read the full contract)
- Task progress SoT: task bundle `00-overview.md` `State:`
- Task identity SoT: `.ai-task.yaml` `task_id`
- Project semantic SoT: `.ai/project/<project>/registry.yaml`
- Migration: missing `.ai-task.yaml` is a warning, but invalid/duplicate IDs are errors

## Verification
- Lint (check-only):
  - `node .ai/scripts/projectctl.mjs lint --check --project main`
- Sync preview (no writes):
  - `node .ai/scripts/projectctl.mjs sync --dry-run --project main --init-if-missing`
- If you changed SSOT skills:
  - `node .ai/scripts/lint-skills.mjs --strict`
  - `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`

## Boundaries
- Do not edit `.codex/skills/` or `.claude/skills/` directly (generated).
- Do not require Python or third-party dependencies for governance scripts.
- Do not treat `.ai-task.yaml.status` as authoritative for task progress.
