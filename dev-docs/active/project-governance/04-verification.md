# 04 Verification

## Automated checks
- 2026-02-04
  - `node .ai/scripts/lint-skills.mjs --strict` (pass)
  - `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes` (pass)
  - `node .ai/scripts/projectctl.mjs lint --check --project main` (pass; warnings only)
  - `node .ai/scripts/projectctl.mjs init --project main --dry-run` (pass)
  - `node .ai/scripts/projectctl.mjs sync --dry-run --project main --init-if-missing` (pass)

## Manual smoke checks
- N/A (template repo; no product runtime)

## Rollout / Backout (if applicable)
- Rollout:
- Backout:
