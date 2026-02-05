# 03 Implementation Notes

## Status
- Current status: `in-progress`
- Last updated: 2026-02-05

## What changed
- Started implementation after aligning SoT rules:
  - Task progress SoT remains in `dev-docs/**` bundle (`00-overview.md` State).
  - `.ai-task.yaml` is identity SoT for `task_id` and a derived display mirror for `status`.

- Added repo-level contract + entrypoint docs:
  - `.ai/project/CONTRACT.md`
  - `.ai/project/AGENTS.md`

- Added two SSOT skills under `.ai/skills/workflows/planning/`:
  - `project-orchestrator`
  - `project-sync-lint` (with hub templates)

- Added a dependency-free governance script:
  - `.ai/scripts/projectctl.mjs` (init/lint/sync/query + optional sync --changelog)

- Updated CI templates used by `cictl.mjs` to include a governance lint step.

## Files/modules touched (high level)
- `.ai/project/CONTRACT.md`
- `.ai/project/AGENTS.md`
- `.ai/skills/workflows/planning/project-orchestrator/SKILL.md`
- `.ai/skills/workflows/planning/project-sync-lint/SKILL.md`
- `.ai/skills/workflows/planning/project-sync-lint/templates/main/*`
- `.ai/scripts/projectctl.mjs`
- `.ai/skills/testing/test-ci-github-actions/reference/templates/github-actions/ci.yml`
- `.ai/skills/testing/test-ci-gitlab-ci/reference/templates/gitlab-ci/.gitlab-ci.yml`

## Decisions & tradeoffs
- Decision:
  - Rationale:
  - Alternatives considered:

## Deviations from plan
- Change:
  - Why:
  - Impact:

## Known issues / follow-ups
- ...

## Pitfalls / dead ends (do not repeat)
- Keep the detailed log in `05-pitfalls.md` (append-only).
