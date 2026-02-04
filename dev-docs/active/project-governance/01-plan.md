# 01 Plan

## Milestones
1. Add the Project Contract and AGENTS entrypoint under `.ai/project/`.
2. Add `project-orchestrator` skill (front door triage/mapping; no code changes).
3. Add `project-sync-lint` skill and repo-level script `projectctl.mjs` (init/lint/sync).
4. Update CI templates referenced by `cictl.mjs` to run project governance lint.
5. Verify: run `lint-skills`, regenerate stubs, and run `projectctl` commands in a clean repo state.

## Detailed steps
- Define and write `.ai/project/CONTRACT.md` (English) with SoT rules:
  - Task progress SoT = `dev-docs/**/active/<task>/00-overview.md` `State`
  - Task identity SoT = `dev-docs/**/active/<task>/.ai-task.yaml` `task_id`
  - Project semantic SoT = `.ai/project/<project>/registry.yaml`
- Define and write `.ai/project/AGENTS.md` (English) with quickstart commands.
- Add SSOT skills under `.ai/skills/workflows/planning/` with English-only content.
- Implement `node .ai/scripts/projectctl.mjs`:
  - `init`: create `.ai/project/<project>/` from templates (idempotent, no overwrite)
  - `lint`: scan dev-docs roots, validate IDs and drift (warnings vs errors per contract)
  - `sync`: generate missing `.ai-task.yaml` IDs, upsert registry, regenerate derived views
- Add templates for hub files under the `project-sync-lint` skill so init is self-contained.
- Integrate CI:
  - Update GitHub Actions and GitLab CI templates under `test-ci-*` skills to include a governance lint command.
- Verification:
  - `node .ai/scripts/lint-skills.mjs --strict`
  - `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`
  - `node .ai/scripts/projectctl.mjs lint --check` (warn-only in template repo)

## Risks & mitigations
- Risk:
  - Mitigation:
- Risk: Contract drift between docs and scripts leads to inconsistent behavior.
  - Mitigation: Encode rules in `.ai/project/CONTRACT.md` and have `projectctl lint` validate contract-required invariants.
- Risk: YAML parsing complexity / edge cases.
  - Mitigation: Keep registry and meta schemas intentionally minimal and use marker-based updates for derived views.
