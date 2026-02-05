# 02 Architecture

## Context & current state
- Existing task-level execution system lives under `dev-docs/**` and is the source of truth for work-in-progress details.
- Skills SSOT lives under `.ai/skills/` and provider stubs live under `.codex/skills/` and `.claude/skills/`.
- Repo scripts are primarily dependency-free Node ESM `.mjs` files under `.ai/scripts/`.

## Proposed design
Introduce a repo-level project governance layer that aggregates progress and mappings across tasks while preserving the existing `dev-docs/**` execution workflow.

### Components / modules
- Contract docs:
  - `.ai/project/CONTRACT.md` (SSOT rules and validation requirements)
  - `.ai/project/AGENTS.md` (AI entrypoint and usage)
- Skills:
  - `project-orchestrator`: front-door triage/dedupe/mapping; updates project hub docs/registry; does not implement code changes.
  - `project-sync-lint`: governance tool workflow; runs init/lint/sync via `projectctl.mjs`.
- Script:
  - `node .ai/scripts/projectctl.mjs`: implements `init`, `lint`, `sync`, and `query` in a dependency-free way.
- Templates:
  - Hub templates under `project-sync-lint/templates/main/` for `init` to copy into `.ai/project/<project>/`.

### Interfaces & contracts
- Data models / schemas:
  - Task progress SoT: `dev-docs/**/active/<task>/00-overview.md` `## Status` / `- State: <single-value>`
  - Task identity SoT: `dev-docs/**/active/<task>/.ai-task.yaml` `task_id`
  - Project registry SoT: `.ai/project/<project>/registry.yaml` (milestones/features/requirements/tasks + roots configuration)
- Commands:
  - `projectctl init --project <slug>`
  - `projectctl lint --check --project <slug>`
  - `projectctl sync --apply|--dry-run --project <slug>`
  - `projectctl sync --apply --project <slug> --changelog` (append-only changelog events)
  - `projectctl query --project <slug> --text "<keywords>"`

### Boundaries & dependency rules
- Allowed dependencies:
- Node built-ins only (no third-party dependencies).
- Reuse existing shared libs under `.ai/scripts/lib/` where helpful.
- Forbidden dependencies:
  - Do not require Python or external YAML libraries.
  - Do not modify generated stubs under `.codex/` or `.claude/` directly.

## Data migration (if applicable)
- Migration steps:
- During migration, missing `.ai-task.yaml` is a warning; `sync --apply` can generate missing task meta IDs.
- Backward compatibility strategy:
  - Existing tasks continue to run on `dev-docs/**`; project hub is additive.
- Rollout plan:
  - Template repo ships with contract + skills + scripts + CI templates.
  - Real repos run `projectctl init` once, then gate changes with `projectctl lint --check` in CI.

## Non-functional considerations
- Security/auth/permissions:
- No secrets are introduced; all data is repo-local metadata.
- Performance:
- Scans are filesystem-bound; restrict traversal to configured or discovered `dev-docs` roots.
- Observability (logs/metrics/traces):
- CLI output includes a warnings/errors summary with stable formatting for CI logs.

## Open questions
- None (core rules were confirmed in discussion). Future: decide if any warnings become errors under `--strict`.
